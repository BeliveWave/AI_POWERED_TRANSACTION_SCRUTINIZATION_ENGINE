import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw, Activity, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

const Investigator = () => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/investigations');
      if (response.ok) {
        const data = await response.json();
        setInvestigations(data);
        if (data.length > 0) setSelectedCase(data[0]);
      }
    } catch (error) {
      console.error("Error fetching investigations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const formatCurrency = (amount) => `LKR ${parseFloat(amount).toFixed(2)}`;
  
  const getFeatureLabel = (featureKey) => {
    const map = {
      'amount': 'Transaction Amount',
      'hour_of_day': 'Hour of Transaction',
      'velocity_1h': '1-Hour Transaction Velocity',
      'is_foreign': 'Foreign IP / Card Origin',
      'merchant_category_code': 'Merchant Category Code',
      'pos_entry_mode': 'POS Entry Mode',
      'currency': 'Currency Discrepancy',
      'moto_eci_indicator': 'MOTO/ECI Indicator',
      'three_d_secure': '3-D Secure Status'
    };
    return map[featureKey] || featureKey;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Investigation Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Model attribution and SHAP feature drivers for escalated or policy-declined events.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInvestigations} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          Loading investigation records...
        </Card>
      ) : investigations.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-2">
            <AlertTriangle className="mx-auto text-muted-foreground mb-3 opacity-50" size={32} />
            <h3 className="text-base font-semibold text-foreground">No active cases in queue</h3>
            <p className="text-sm text-muted-foreground">All flagged transactions have been reviewed or cleared by policy.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Case List Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Active Cases ({investigations.length})
            </div>
            
            {investigations.map((inv) => {
              const isSelected = selectedCase?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedCase(inv)}
                  className={`p-4 rounded-lg cursor-pointer transition-all border text-sm space-y-2 ${
                    isSelected
                      ? 'bg-muted border-foreground/30 shadow-xs'
                      : 'bg-card border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground tabular-nums">#{inv.id}</span>
                    <Badge variant={inv.status === 'Decline' ? 'destructive' : 'warning'}>
                      {inv.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="font-medium text-foreground">{inv.customer_name}</div>
                    <div className="text-muted-foreground tabular-nums text-xs mt-0.5">{formatCurrency(inv.amount)}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border">
                    <span className="tabular-nums">{new Date(inv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      Risk: {(inv.fraud_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Case Detail & SHAP Feature Explanations (8 cols) */}
          <div className="lg:col-span-8">
            {selectedCase && (
              <Card>
                <CardHeader className="p-6 border-b border-border flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Investigation #{selectedCase.id}</CardTitle>
                      <Badge variant={selectedCase.status === 'Decline' ? 'destructive' : 'warning'}>
                        {selectedCase.status}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      Recorded on {new Date(selectedCase.timestamp).toLocaleString()}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  
                  {/* Transaction Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                      <div className="text-muted-foreground text-xs uppercase font-semibold">Amount</div>
                      <div className="font-bold tabular-nums text-foreground mt-0.5">{formatCurrency(selectedCase.amount)}</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                      <div className="text-muted-foreground text-xs uppercase font-semibold">Merchant</div>
                      <div className="font-bold text-foreground truncate mt-0.5" title={selectedCase.merchant}>{selectedCase.merchant}</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                      <div className="text-muted-foreground text-xs uppercase font-semibold">Instrument</div>
                      <div className="font-bold tabular-nums text-foreground mt-0.5">{selectedCase.card_type} •••• {selectedCase.card_last_four}</div>
                    </div>
                    <div className="p-3.5 rounded-lg border border-border bg-muted/30">
                      <div className="text-muted-foreground text-xs uppercase font-semibold">Risk Confidence</div>
                      <div className="font-bold tabular-nums text-foreground mt-0.5">{(selectedCase.fraud_score * 100).toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* SHAP Feature Impact Bars */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Key Decision Drivers (SHAP Attribution)
                      </h3>
                      <span className="text-xs text-muted-foreground">Relative factor weight</span>
                    </div>

                    {selectedCase.shap_explanation ? (
                      <div className="space-y-3.5 p-4 rounded-lg border border-border bg-card">
                        {Object.entries(selectedCase.shap_explanation).map(([feature, impact], index) => {
                          const percentage = Math.min(Math.abs(impact * 100) * 4, 100);
                          const isElevating = impact > 0;
                          return (
                            <div key={feature} className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-foreground">
                                  {index + 1}. {getFeatureLabel(feature)}
                                </span>
                                <span className={`font-mono text-[11px] font-semibold ${isElevating ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {isElevating ? `+${impact.toFixed(3)} (risk elevating)` : `${impact.toFixed(3)} (mitigating)`}
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isElevating ? 'bg-red-600 dark:bg-red-500' : 'bg-emerald-600 dark:bg-emerald-500'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                        No SHAP explanation available for this historical record.
                      </div>
                    )}
                  </div>

                  {/* Quick Action Footer */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button variant="default" size="sm" className="flex-1">
                      Approve & Clear Case
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1">
                      Confirm Fraud & Block
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Request Customer Verification
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Investigator;
