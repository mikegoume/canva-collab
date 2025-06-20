import CreateCanvasButton from "@/components/atoms/CreateCanvasButton";
import CanvasList from "@/components/organisms/CanvasList";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center space-y-6 text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Canvas Creator
        </h1>
        <p className="text-muted-foreground max-w-[600px] text-lg">
          Create, edit, and manage interactive canvases with resizable elements.
          Keep track of your changes with our built-in history feature.
        </p>
        <CreateCanvasButton />
      </div>
      <section className="my-12">
        <h2 className="text-2xl font-semibold mb-6">Your Canvases</h2>
        <CanvasList />
      </section>
    </main>
  );
}