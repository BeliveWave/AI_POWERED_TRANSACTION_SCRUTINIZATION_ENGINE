"""
Neo4j graph service for fraud ring detection.
Fails gracefully if Neo4j is unavailable — GNN score returns 0.0 (neutral).
"""
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class GraphService:
    def __init__(self):
        self.driver = None
        self._available = None  # None = not tested yet

    def _get_driver(self):
        """Lazy connection to Neo4j."""
        if self._available is False:
            return None
        if self.driver is not None:
            return self.driver
        try:
            from neo4j import GraphDatabase
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                connection_timeout=3
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            self._available = True
            logger.info('Connected to Neo4j Graph Database')
            return self.driver
        except Exception as e:
            self._available = False
            logger.warning(f'Neo4j unavailable, graph features disabled: {e}')
            self.driver = None
            return None

    def close(self):
        if self.driver:
            self.driver.close()

    def sync_transaction(self, txn_data: dict, metadata: dict):
        """Creates nodes and relationships in Neo4j. No-op if Neo4j unavailable."""
        driver = self._get_driver()
        if not driver:
            return

        query = """
        MERGE (t:Transaction {id: $txn_id})
        SET t.amount = $amount, t.timestamp = $timestamp, t.status = $status
        MERGE (c:Customer {id: $customer_id})
        MERGE (c)-[:MADE_TXN]->(t)
        FOREACH (ignoreMe IN CASE WHEN $ip_address IS NOT NULL AND $ip_address <> '' THEN [1] ELSE [] END |
            MERGE (ip:IPAddress {address: $ip_address})
            MERGE (t)-[:USED_IP]->(ip)
        )
        FOREACH (ignoreMe IN CASE WHEN $device_fingerprint IS NOT NULL AND $device_fingerprint <> '' THEN [1] ELSE [] END |
            MERGE (d:Device {fingerprint: $device_fingerprint})
            MERGE (t)-[:USED_DEVICE]->(d)
        )
        FOREACH (ignoreMe IN CASE WHEN $shipping_address IS NOT NULL AND $shipping_address <> '' THEN [1] ELSE [] END |
            MERGE (a:Address {address: $shipping_address})
            MERGE (t)-[:SHIPPED_TO]->(a)
        )
        FOREACH (ignoreMe IN CASE WHEN $terminal_id IS NOT NULL AND $terminal_id <> '' THEN [1] ELSE [] END |
            MERGE (term:Terminal {id: $terminal_id})
            MERGE (t)-[:AT_TERMINAL]->(term)
        )
        """
        parameters = {
            'txn_id': str(txn_data.get('transaction_id', '')),
            'amount': float(metadata.get('amount', 0.0)),
            'timestamp': float(txn_data.get('ingestion_time', 0.0)),
            'status': 'Pending',
            'customer_id': str(metadata.get('customer_id', '')),
            'ip_address': metadata.get('ip_address'),
            'device_fingerprint': metadata.get('device_fingerprint'),
            'shipping_address': metadata.get('shipping_address'),
            'terminal_id': metadata.get('terminal_id'),
        }
        try:
            with driver.session() as session:
                session.run(query, parameters)
        except Exception as e:
            logger.error(f'Error syncing to graph: {e}')

    def get_transaction_subgraph(self, txn_id: str) -> float:
        """Returns fraud connection count, or 0.0 if Neo4j unavailable."""
        driver = self._get_driver()
        if not driver:
            return 0.0
        query = """
        MATCH (t:Transaction {id: $txn_id})-[:USED_IP|USED_DEVICE|SHIPPED_TO|AT_TERMINAL]->(entity)<-[:USED_IP|USED_DEVICE|SHIPPED_TO|AT_TERMINAL]-(other_t:Transaction)
        WHERE other_t.status = 'Decline' OR other_t.status = 'Fraud'
        RETURN count(DISTINCT other_t) as fraud_connections
        """
        try:
            with driver.session() as session:
                result = session.run(query, {'txn_id': txn_id})
                record = result.single()
                return float(record['fraud_connections']) if record else 0.0
        except Exception as e:
            logger.error(f'Error querying subgraph: {e}')
            return 0.0


# Singleton — lazy, does NOT connect at import time
graph_db = GraphService()
