import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function Solicitudes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Solicitudes</h1>
        <p className="text-muted-foreground">Gestión de solicitudes de préstamo</p>
      </div>
      <Card className="shadow-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <FileText className="h-12 w-12 opacity-30" />
            <p>El módulo de solicitudes se implementará en la Fase 3.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
