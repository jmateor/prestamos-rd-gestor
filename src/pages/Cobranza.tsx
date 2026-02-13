import { Card, CardContent } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export default function Cobranza() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cobranza</h1>
        <p className="text-muted-foreground">Control de pagos y cuotas</p>
      </div>
      <Card className="shadow-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Receipt className="h-12 w-12 opacity-30" />
            <p>El módulo de cobranza se implementará en la Fase 5.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
