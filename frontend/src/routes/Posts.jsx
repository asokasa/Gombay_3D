import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../lib/api";

export default function Posts() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const posts = useQuery({ queryKey: ["posts"], queryFn: () => api("/posts") });
  const create = useMutation({
    mutationFn: () => api("/posts", { method: "POST", body: { title, body: "hello" } }),
    onSuccess: () => {
      setTitle("");
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <div className="neon-page flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <section className="neon-panel rounded-lg p-6">
          <h1 className="neon-heading text-3xl font-bold">Posts</h1>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <input
              className="min-w-0 flex-1 rounded-md border px-3 py-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
            />
            <button className="neon-button px-4 py-2" type="submit">
              Add
            </button>
          </form>
          {posts.isLoading ? (
            <p className="mt-4 text-slate-400">Loading...</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {posts.data?.map((post) => (
                <li key={post._id || post.id} className="neon-card p-4">
                  <b>{post.title}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
