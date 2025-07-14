import React from "react";
import { notFound } from "next/navigation";
import { workOrdersAPI } from "@/lib/api-client";
import { WorkOrderDetails } from "@/components/provider/work-order-details";

interface PageProps {
  params: { id: string }
}

export default async function SupervisorOrderDetailPage({ params }: PageProps) {
  const { id } = params;
  let workOrder = null;
  try {
    workOrder = await workOrdersAPI.getById(id);
  } catch (e) {
    return notFound();
  }

  if (!workOrder) return notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Orden de Trabajo #{id}</h1>
      <p className="text-muted-foreground mb-6">{workOrder.actividad} - {workOrder.campo}</p>
      <WorkOrderDetails workOrder={workOrder} />
    </div>
  );
} 