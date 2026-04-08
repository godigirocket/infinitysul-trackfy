"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { parse } from "papaparse";
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, 
  Table as TableIcon, ArrowRight, Trash2, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface BIMappedRow {
  date: string;
  product: string;
  revenue: number;
  sales: number;
}

export function BIConnector() {
  const { biData, setBiData } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [mapping, setMapping] = useState({
    date: "",
    product: "",
    revenue: "",
    sales: ""
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        setIsUploading(false);
        if (results.data && results.data.length > 0) {
          setPreview(results.data);
          // Auto-detect columns
          const cols = Object.keys(results.data[0]);
          setMapping({
            date: cols.find(c => c.toLowerCase().includes("data") || c.toLowerCase().includes("date")) || "",
            product: cols.find(c => ["bradesco", "hapvida", "amil", "unimed", "sulamerica", "plano", "operadora", "produto"].some(p => c.toLowerCase().includes(p))) || "",
            revenue: cols.find(c => ["valor", "faturamento", "receita", "total", "bruto"].some(p => c.toLowerCase().includes(p))) || "",
            sales: cols.find(c => ["vendas", "venda", "qtd", "quantidade", "conversão"].some(p => c.toLowerCase().includes(p))) || ""
          });
        }
      },
      error: (err: any) => {
        setIsUploading(false);
        setError("Erro ao ler o arquivo CSV. Verifique o formato.");
      }
    });
  };

  const confirmImport = () => {
    if (!mapping.date || !mapping.revenue) {
      setError("Mapeie pelo menos a Data e o Valor da Venda.");
      return;
    }

    const mappedData: BIMappedRow[] = preview.map(row => ({
      date: row[mapping.date],
      product: row[mapping.product] || "Geral",
      revenue: parseFloat(row[mapping.revenue]?.toString().replace(/[^\d.,]/g, "").replace(",", ".") || "0"),
      sales: parseInt(row[mapping.sales] || "1")
    }));

    setBiData([...biData, ...mappedData]);
    setPreview([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="glass p-8 space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
        <FileSpreadsheet className="w-32 h-32 text-white" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Integração BI Executiva</h3>
            <p className="text-[10px] text-muted font-bold uppercase tracking-tight mt-0.5">Vincule vendas reais (Bradesco, Amil, etc.) ao seu Gasto Meta.</p>
          </div>
        </div>

        {biData.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setBiData([])}
            className="text-danger hover:bg-danger/10 h-8 px-3 text-[10px] font-bold uppercase"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Limpar Dados
          </Button>
        )}
      </div>

      {!preview.length ? (
        <div className="border-2 border-dashed border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="p-4 bg-accent/20 rounded-full animate-bounce">
            <Upload className="w-6 h-6 text-accent" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">Clique para importar sua planilha BI</p>
            <p className="text-[10px] text-muted uppercase font-bold mt-1">Formatos suportados: .csv (Excel / Google Sheets)</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileUpload}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
           <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                <TableIcon className="w-3.5 h-3.5" />
                Mapeamento de Colunas
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(mapping).map(([key, val]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted uppercase">{key === 'revenue' ? 'Valor Venda' : key === 'product' ? 'Produto/Plano' : key === 'sales' ? 'Qtd Vendas' : 'Data'}</label>
                    <select 
                      value={val} 
                      onChange={(e) => setMapping({...mapping, [key]: e.target.value})}
                      className="w-full bg-surface border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white focus:border-accent outline-none"
                    >
                      <option value="">Selecionar...</option>
                      {Object.keys(preview[0]).map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
           </div>

           <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-success" />
                {preview.length} linhas detectadas no arquivo
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={() => setPreview([])}>Cancelar</Button>
                <Button size="sm" className="bg-success text-white" onClick={confirmImport}>
                  Confirmar Importação
                  <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </div>
           </div>
        </div>
      )}

      {biData.length > 0 && (
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-8">
              <div>
                <span className="text-[10px] text-muted font-bold uppercase block mb-1">Total BI Importado</span>
                <span className="text-lg font-bold text-success mono">
                  {formatCurrency(biData.reduce((s, x) => s + x.revenue, 0))}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted font-bold uppercase block mb-1">Vendas Reais</span>
                <span className="text-lg font-bold text-white mono">
                  {biData.reduce((s, x) => s + x.sales, 0)}
                </span>
              </div>
           </div>
           
           <div className="px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-black text-success uppercase">Base de ROI Ativa</span>
           </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-3 text-danger">
          <AlertCircle className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase">{error}</span>
        </div>
      )}
    </div>
  );
}
