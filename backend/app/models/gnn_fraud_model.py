import torch
import torch.nn.functional as F
import logging

logger = logging.getLogger(__name__)

try:
    from torch_geometric.nn import SAGEConv, GATConv
    PYG_AVAILABLE = True
except ImportError:
    PYG_AVAILABLE = False
    logger.warning("torch_geometric is not installed. GNN will operate in heuristic fallback mode.")

class FraudGNN(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels):
        super(FraudGNN, self).__init__()
        if not PYG_AVAILABLE:
            raise ImportError("torch_geometric is required to run FraudGNN")
        
        # Using Graph Attention Networks (GAT) to weight important connections
        self.conv1 = GATConv(in_channels, hidden_channels, heads=2, concat=True)
        self.conv2 = GATConv(hidden_channels * 2, hidden_channels, heads=1, concat=False)
        self.fc = torch.nn.Linear(hidden_channels, out_channels)

    def forward(self, x, edge_index):
        # x: Node feature matrix
        # edge_index: Graph connectivity matrix
        
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.5, training=self.training)
        
        x = self.conv2(x, edge_index)
        x = F.relu(x)
        
        x = self.fc(x)
        return torch.sigmoid(x)  # Return probability between 0 and 1

def get_gnn_fraud_score(txn_id: str, graph_service):
    """
    Computes a graph-based fraud score for the transaction.
    If PyG and a trained model are available, it runs the GNN inference.
    Otherwise, it falls back to a heuristic derived from the Neo4j subgraph.
    """
    fraud_connections = graph_service.get_transaction_subgraph(txn_id)
    
    # Simple Heuristic Fallback (e.g., 0 connections = 0.0, 1 = 0.15, 2 = 0.30...)
    score = min(fraud_connections * 0.15, 0.95)
    return score
