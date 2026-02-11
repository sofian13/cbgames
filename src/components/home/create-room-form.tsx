"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateRoomCode } from "@/lib/party/constants";
import { Plus } from "lucide-react";

export function CreateRoomForm() {
  const router = useRouter();

  const handleCreate = () => {
    const code = generateRoomCode();
    router.push(`/room/${code}`);
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-xl">Créer une salle</CardTitle>
        <CardDescription>
          Crée une nouvelle salle et invite tes potes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleCreate} className="w-full gap-2" size="lg">
          <Plus className="h-5 w-5" />
          Nouvelle salle
        </Button>
      </CardContent>
    </Card>
  );
}
