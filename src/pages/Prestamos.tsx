import { Card, CardContent } from '@/components/ui/card';
import { Landmark } from 'lucide-react';

export default function Prestamos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Préstamos</h1>
        <p className="text-muted-foreground">Administración de préstamos activos</p>
      </div>
      <Card className="shadow-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Landmark className="h-12 w-12 opacity-30" />
            <p>El módulo de préstamos se implementará en la Fase 4.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
