"use client";

import { useAppStore } from "@/store/useAppStore";
import { formatCurrency } from "@/lib/formatters";
import { UserCheck, XCircle, Clock, Save, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { CRMLead } from "@/types";

export function LeadManagement() {
  const { dataA, crmLeads, updateCRMLead } = useAppStore();
  
  // Extract recent leads from Meta Insights actions
  const recentLeads = useMemo(() => {
    const list: any[] = [];
    dataA.forEach(insight => {
      const leads = insight.actions?.find(a => a.action_type === 'lead')?.value || "0";
      const leadCount = parseInt(leads);
      for (let i = 0; i < leadCount; i++) {
        list.push({
          id: `${insight.ad_id || insight.campaign_id}_${i}`,
          campaign_name: insight.campaign_name,
          campaign_id: insight.campaign_id,
          date: insight.date_start
        });
      }
    });
    return list.slice(0, 50); // Limit for UI performance
  }, [dataA]);

  const getLeadStatus = (id: string): CRMLead['status'] => {
    return crmLeads.find(l => l.lead_id === id)?.status || 'new';
  };

  const setStatus = (id: string, campaignId: string, status: CRMLead['status']) => {
    const lead = crmLeads.find(l => l.lead_id === id) || {
      lead_id: id,
      campaign_id: campaignId,
      status: 'new',
      date: new Date().toISOString()
    };
    
    updateCRMLead({
      ...lead,
      status,
      sale_value: status === 'converted' ? (lead.sale_value || 0) : 0
    });
  };

  return (
    <div className="glass overflow-hidden border-white/5">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-success" />
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest">Gestão de Leads (CRM Lite)</h3>
        </div>
        <div className="text-[10px] font-bold text-muted uppercase bg-white/5 px-2 py-1 rounded">
          {crmLeads.filter(l => l.status === 'converted').length} Vendas Realizadas
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/[0.02] text-[10px] text-muted uppercase font-bold tracking-wider">
              <th className="px-6 py-4 text-left border-b border-white/5">Data</th>
              <th className="px-6 py-4 text-left border-b border-white/5">Campanha</th>
              <th className="px-6 py-4 text-center border-b border-white/5">Status</th>
              <th className="px-6 py-4 text-right border-b border-white/5">Valor Real</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {recentLeads.map((lead) => {
              const status = getLeadStatus(lead.id);
              const saleValue = crmLeads.find(l => l.lead_id === lead.id)?.sale_value || 0;

              return (
                <tr key={lead.id} className="hover:bg-white/[0.01] transition-all">
                  <td className="px-6 py-4 text-xs tabular-nums text-muted">{lead.date}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold block truncate max-w-[200px]">{lead.campaign_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => setStatus(lead.id, lead.campaign_id, 'contacted')}
                        className={`p-1.5 rounded transition-all ${status === 'contacted' ? 'bg-warning/20 text-warning scale-110' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                        title="Contatado"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setStatus(lead.id, lead.campaign_id, 'converted')}
                        className={`p-1.5 rounded transition-all ${status === 'converted' ? 'bg-success/20 text-success scale-110' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                        title="Convertido (Venda)"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setStatus(lead.id, lead.campaign_id, 'lost')}
                        className={`p-1.5 rounded transition-all ${status === 'lost' ? 'bg-danger/20 text-danger scale-110' : 'bg-white/5 text-muted hover:bg-white/10'}`}
                        title="Perdido"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums font-bold text-xs">
                    {status === 'converted' ? (
                      <span className="text-success">{formatCurrency(saleValue)}</span>
                    ) : (
                      <span className="text-muted/30">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
