import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, DollarSign } from "lucide-react";

export default function FinanceiroDashboard() {
  const [balance] = useState(12450.50);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro OCS</h1>
      
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Wallet className="w-4 h-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Entradas (Mês)</CardTitle>
            <ArrowUpCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 15.200,00</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Saídas (Mês)</CardTitle>
            <ArrowDownCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 8.450,00</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button><ArrowUpCircle className="mr-2 w-4 h-4" /> Nova Receita</Button>
          <Button variant="destructive"><ArrowDownCircle className="mr-2 w-4 h-4" /> Nova Despesa</Button>
          <Button variant="outline"><TrendingUp className="mr-2 w-4 h-4" /> Ver Relatórios</Button>
        </CardContent>
      </Card>
    </div>
  );
}
