import HermesAIBuilder from "@/components/workflow/HermesAIBuilder";

export default async function Page({ params } : { params: Promise<{ projectId: string}>}) {
  const { projectId } = await params;
  
  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <HermesAIBuilder />
    </div>
  );
}
