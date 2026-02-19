import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCategories } from "@/lib/db";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();
  return (
    <>
      <Header categories={categories} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
