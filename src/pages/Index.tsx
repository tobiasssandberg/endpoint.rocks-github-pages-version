import { useState, useCallback } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ToolCatalog from "@/components/ToolCatalog";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toolCount, setToolCount] = useState(0);
  const [blogCount, setBlogCount] = useState(0);

  const handleToolCount = useCallback((count: number) => setToolCount(count), []);
  const handleBlogCount = useCallback((count: number) => setBlogCount(count), []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          toolCount={toolCount}
          blogCount={blogCount}
        />
        <BlogSection searchQuery={searchQuery} onResultCount={handleBlogCount} />
        <ToolCatalog
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onResultCount={handleToolCount}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
