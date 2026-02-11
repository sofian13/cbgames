"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROOM_CODE_LENGTH } from "@/lib/party/constants";
import { ArrowRight } from "lucide-react";

export function JoinRoomForm() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === ROOM_CODE_LENGTH) {
      router.push(`/room/${trimmed}`);
    }
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-xl">Rejoindre une salle</CardTitle>
        <CardDescription>
          Entre le code à 4 lettres de la salle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, ROOM_CODE_LENGTH))}
            placeholder="ABCD"
            className="font-mono text-center text-lg tracking-[0.3em] uppercase"
            maxLength={ROOM_CODE_LENGTH}
          />
          <Button type="submit" disabled={code.length !== ROOM_CODE_LENGTH} size="lg">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
