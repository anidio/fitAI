"use client";

import { useState } from "react";
import { Pencil, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertUserTrainData } from "@/app/_lib/api/fetch-generated";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  initialData: {
    weightInGrams: number;
    heightInCentimeters: number;
    age: number;
    bodyFatPercentage: number;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Local state for the form
  const [formData, setFormData] = useState({
    weight: initialData.weightInGrams > 0 ? (initialData.weightInGrams / 1000).toString() : "",
    height: initialData.heightInCentimeters > 0 ? initialData.heightInCentimeters.toString() : "",
    age: initialData.age > 0 ? initialData.age.toString() : "",
    bodyFat: initialData.bodyFatPercentage > 0 ? initialData.bodyFatPercentage.toString() : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await upsertUserTrainData({
        weightInGrams: Math.round(parseFloat(formData.weight || "0") * 1000),
        heightInCentimeters: parseInt(formData.height || "0"),
        age: parseInt(formData.age || "0"),
        bodyFatPercentage: parseInt(formData.bodyFat || "0"),
      });
      
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar dados do perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="icon" 
        className="size-10 rounded-full border-primary/20 hover:bg-primary/10"
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="size-4 text-primary" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-200 rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold text-foreground">Editar Perfil</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-xs uppercase tracking-wider text-muted-foreground">Peso (Kg)</Label>
              <Input 
                id="weight"
                type="number"
                step="0.1"
                placeholder="75.5"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-xs uppercase tracking-wider text-muted-foreground">Altura (Cm)</Label>
              <Input 
                id="height"
                type="number"
                placeholder="175"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-xs uppercase tracking-wider text-muted-foreground">Idade</Label>
              <Input 
                id="age"
                type="number"
                placeholder="25"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyFat" className="text-xs uppercase tracking-wider text-muted-foreground">Gordura Corporal (%)</Label>
              <Input 
                id="bodyFat"
                type="number"
                placeholder="15"
                value={formData.bodyFat}
                onChange={(e) => setFormData(prev => ({ ...prev, bodyFat: e.target.value }))}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 rounded-xl"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 rounded-xl gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
