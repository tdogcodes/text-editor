import { TextColumnEditor } from '../components/text-column-editor';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Text Column Editor</h1>
      <TextColumnEditor />
    </main>
  );
}
