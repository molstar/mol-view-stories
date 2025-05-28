"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye } from "lucide-react";
import { MolStar } from "./MolStar";

interface VisualizationPanelProps {
  className?: string;
}

export function VisualizationPanel({ className }: VisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState("molstar");

  return (
    <Card className={`h-full flex flex-col ${className || ""}`}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <CardTitle className="text-sm text-muted-foreground">
              Visualization
            </CardTitle>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="molstar">MolStar</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full"
        >
          <TabsContent value="molstar" className="h-full">
            <div className="w-full" style={{ aspectRatio: "1.3/1" }}>
              <MolStar />
            </div>
          </TabsContent>
          <TabsContent value="markdown" className="h-full">
            <div className="h-full min-h-[500px] bg-gray-50 rounded-lg p-4">
              <div className="text-gray-500 italic">
                Markdown renderer component (TBD)
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}