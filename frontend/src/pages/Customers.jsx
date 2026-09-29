import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/table.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog.jsx';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerStr, setNewCustomerStr] = useState({ name: '', email: '', cardType: 'Visa', cardLastFour: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchCustomers = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (filterType !== 'all') queryParams.append('risk_filter', filterType);

      const response = await fetch(`http://localhost:8000/api/customers?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        const mappedCustomers = data.map(c => ({
          id: c.id,
          name: c.full_name,
          email: c.email,
          card: `${c.card_type} •••• ${c.card_last_four}`,
          riskScore: c.risk_score || 0.0,
          lastActivity: c.last_activity === 'Never' ? 'Never' : new Date(c.last_activity).toLocaleString(),
          txnCount: c.transaction_count,
          status: c.risk_score > 0.5 ? 'High' : 'Low',
          isFrozen: c.is_frozen,
          isActive: c.is_active
        }));
        setCustomers(mappedCustomers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);

  const handleFreeze = async (customer) => {
    try {
      const response = await fetch(`http://localhost:8000/api/customers/${customer.id}/freeze`, {
        method: 'POST'
      });
      if (response.ok) {
        setCustomers(customers.map(c => 
          c.id === customer.id ? { ...c, isFrozen: !c.isFrozen } : c
        ));
      }
    } catch (error) {
      console.error("Error freezing customer:", error);
    }
  };

  const handleDeactivate = async (customer) => {
    if (!window.confirm(`Are you sure you want to deactivate ${customer.name}?`)) return;
    try {
      const response = await fetch(`http://localhost:8000/api/customers/${customer.id}/deactivate`, {
        method: 'POST'
      });
      if (response.ok) {
        setCustomers(customers.map(c => 
          c.id === customer.id ? { ...c, isActive: false } : c
        ));
      }
    } catch (error) {
      console.error("Error deactivating customer:", error);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        name: newCustomerStr.name,
        email: newCustomerStr.email,
        card_type: newCustomerStr.cardType,
        card_last_four: newCustomerStr.cardLastFour
      });
      const response = await fetch(`http://localhost:8000/api/customers?${queryParams}`, {
        method: 'POST'
      });
      if (response.ok) {
        setShowAddModal(false);
        setNewCustomerStr({ name: '', email: '', cardType: 'Visa', cardLastFour: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Customer Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage customer risk classifications, card profiles, and account controls.</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Customer
        </Button>
      </div>

      {/* Filter Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customers by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Accounts</option>
              <option value="high">High Risk (&gt;50%)</option>
              <option value="safe">Normal / Low Risk</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Card Instrument</TableHead>
              <TableHead className="text-center">Risk Score</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
              <TableHead className="text-right">Account Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  No customers found. Click "Add Customer" to register an entity.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className={!customer.isActive ? 'opacity-50' : 'hover:bg-muted/50'}>
                  <TableCell>
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      {customer.name}
                      {!customer.isActive && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">Deactivated</Badge>
                      )}
                      {customer.isFrozen && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">Frozen</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{customer.email}</div>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{customer.card}</TableCell>
                  <TableCell className="text-center tabular-nums font-semibold">
                    <span className={customer.riskScore > 0.5 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
                      {(customer.riskScore * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums text-xs">{customer.lastActivity}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-foreground">{customer.txnCount}</TableCell>
                  <TableCell className="text-right">
                    {customer.isActive && (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant={customer.isFrozen ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleFreeze(customer)}
                          className="h-7 px-2 text-xs"
                        >
                          {customer.isFrozen ? "Unfreeze" : "Freeze"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(customer)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600"
                        >
                          Deactivate
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent onClose={() => setShowAddModal(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer Profile</DialogTitle>
            <DialogDescription>Register a new customer account for transaction monitoring.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
              <Input
                type="text"
                required
                value={newCustomerStr.name}
                onChange={e => setNewCustomerStr({...newCustomerStr, name: e.target.value})}
                placeholder="e.g. Inshaf Rajayee"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email Address</label>
              <Input
                type="email"
                required
                value={newCustomerStr.email}
                onChange={e => setNewCustomerStr({...newCustomerStr, email: e.target.value})}
                placeholder="e.g. inshaf@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Card Network</label>
                <select
                  value={newCustomerStr.cardType}
                  onChange={e => setNewCustomerStr({...newCustomerStr, cardType: e.target.value})}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="Amex">Amex</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Last 4 Digits</label>
                <Input
                  type="text"
                  required
                  maxLength="4"
                  pattern="\d{4}"
                  value={newCustomerStr.cardLastFour}
                  onChange={e => setNewCustomerStr({...newCustomerStr, cardLastFour: e.target.value})}
                  placeholder="e.g. 4291"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Register Customer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Customers;