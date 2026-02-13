import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Reportes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Reportes financieros del sistema</p>
      </div>
      <Card className="shadow-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <BarChart3 className="h-12 w-12 opacity-30" />
            <p>El módulo de reportes se implementará en la Fase 8.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
