import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AssistantLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
