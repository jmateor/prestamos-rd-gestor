import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function Garantias() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Garantías</h1>
        <p className="text-muted-foreground">Registro de garantías prendarias</p>
      </div>
      <Card className="shadow-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ShieldCheck className="h-12 w-12 opacity-30" />
            <p>El módulo de garantías se implementará en la Fase 6.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
