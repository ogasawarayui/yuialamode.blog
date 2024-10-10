import fs from 'fs';
import matter from 'gray-matter';
import PostCard from 'components/PostCard';

export const getStaticProps = ({ params }) => {
  const category = decodeURIComponent(params.category);

  const files = fs.readdirSync('posts');
  const posts = files.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fileContent = fs.readFileSync(`posts/${fileName}`, 'utf-8');
    const { data } = matter(fileContent);
    return {
      frontMatter: data,
      slug,
    };
  });

  const filteredPosts = posts.filter((post) => post.frontMatter.categories.includes(category));

  const sortedPosts = filteredPosts.sort((postA, postB) =>
    new Date(postA.frontMatter.date) > new Date(postB.frontMatter.date) ? -1 : 1
  );

  return {
    props: {
      posts: sortedPosts,
    },
  };
};

export const getStaticPaths = () => {
  const files = fs.readdirSync('posts');
  const categories = new Set();

  files.forEach((fileName) => {
    const fileContent = fs.readFileSync(`posts/${fileName}`, 'utf-8');
    const { data } = matter(fileContent);
    if (data.categories) {
      data.categories.forEach((category) => categories.add(category));
    }
  });

  const paths = Array.from(categories).map((category) => ({
    params: { category: encodeURIComponent(category) },
  }));

  return {
    paths,
    fallback: false,
  };
};

const Category = ({ posts }) => {
  return (
    <div className="my-8">
      <div className="grid grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
};

export default Category;