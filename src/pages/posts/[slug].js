import fs from "fs";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import Image from "next/image";
import { NextSeo } from "next-seo";
import remarkToc from "remark-toc";
import rehypeSlug from "rehype-slug";
import remarkPrism from "remark-prism";
import React,{ createElement, Fragment } from "react";
import rehypeParse from "rehype-parse";
import rehypeReact from "rehype-react";
import Link from "next/link";
import "prismjs/themes/prism-tomorrow.css";
import remarkUnwrapImages from "remark-unwrap-images";
import { toc } from "mdast-util-toc";
import { visit } from "unist-util-visit";

// カスタムコードのマークダウン変換処理
const customCode = () => {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "p" && node.children && node.children.length > 0) {
      const firstChild = node.children[0];
      if (firstChild.type === "text" && firstChild.value.startsWith("[comment]")) {
          node.tagName = "div";
          node.properties = {
            className: ["alert"],
          };
          const value = firstChild.value.replace(/\[\/?comment\]/g, "");
          node.children = [
            {
              type: "element",
              tagName: "div",
              properties: { className: ["alert-2"] },
              children: [{ type: "text", value }],
            },
          ];
        }
      }
    });
  };
};

// 目次生成関数
const getToc = (options) => {
  return (node) => {
    // nodeが適切な構造であるかを確認
    if (!node || !node.children || !Array.isArray(node.children)) {
      console.warn("Node structure is not valid for TOC generation");
      node.children = [];
      return;
    }

    // tocがnodeを処理して結果を返す
    const result = toc(node, options);

    // result.mapが存在するかをチェックし、存在しない場合は空の配列を設定
    if (result.map) {
      node.children = [result.map, ...node.children];
    } else {
      // result.mapが存在しない場合の処理
      console.warn("No table of contents generated, node may not contain headings.");
    node.children = [...node.children];
    }
  };
};

// HTMLをReact Nodeに変換する関数
const toReactNode = (html) => {
  console.log("Input HTML:", html);

  return unified()
    .use(rehypeParse, {
      fragment: true,
    })
    .use(rehypeReact, {
      createElement,
      Fragment,
      components: {
        a: MyLink,
        img: MyImage,
      },
    })
    .processSync(html).result;
};

// Static Propsの取得
export async function getStaticProps({ params }) {
  try {
    const file = fs.readFileSync(`posts/${params.slug}.md`, "utf-8");
    const { data, content } = matter(file);
    console.log("Content:", content); // 追加: これで content の中身を確認します
    console.log("FrontMatter:", data);

    // Normalize image path: remove leading slash if present
    if (data.image && data.image.startsWith('/')) {
      data.image = data.image.slice(1);
    }

  // マークダウン処理
  const result = await unified()
    .use(remarkParse)
    .use(remarkToc, {
      heading: "目次",
      tight: true,
    })
    .use(remarkPrism, {
      plugins: ["line-numbers"],
    })
    .use(remarkUnwrapImages)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(customCode)
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  // 目次の処理
  const tocResult = await unified()
    .use(remarkParse)
    .use(getToc, {
      heading: "目次",
      tight: true,
    })
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content)

  return {
    props: {
      frontMatter: data,
      content: result.toString(),
      toc: tocResult.toString(),
      slug: params.slug,
    },
  };
} catch (err) {
  console.error("Error processing markdown content:", err);
  return {
    props: {
      error: true,
      message: "記事の読み込みに失敗しました。",
    },
  };
}
}

// Static Pathsの生成
export async function getStaticPaths() {
  const files = fs.readdirSync("posts");
  const paths = files.map((fileName) => ({
    params: {
      slug: fileName.replace(/\.md$/, ""),
    },
  }));
  return {
    paths,
    fallback: false,
  };
}

//画像の定義
const MyImage = ({ src, alt }) => {
  let imageSrc = src;
  if (imageSrc.startsWith('//')) {
    imageSrc = imageSrc.slice(1);
  }
  if (!imageSrc.startsWith('/')) {
    imageSrc = `/${imageSrc}`;
  }

  return (
    <div className="relative max-w-full h-96">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        style={{ objectFit: "contain" }}
        onError={(e) => {
          e.target.src = "/default-image.JPG"; // 画像が見つからない場合のフォールバック
        }}
        />
    </div>
  );
};

//リンクの定義
const MyLink = ({ children, href }) => {
  if (!href) href = "/";
  return href.startsWith("/") || href.startsWith("#") ? (
    <Link href={href}>{children}</Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};

const Post = ({ frontMatter, content, slug, toc, error, message }) => {
  if (error) {
    return <p>{message}</p>;
  }

  return (
    <>
      <NextSeo
        title={frontMatter.title}
        description={frontMatter.description}
        openGraph={{
          type: "website",
          url: process.env.NEXT_PUBLIC_SITE_URL + `/posts/${slug}`,
          title: frontMatter.title,
          description: frontMatter.description,
          images: [
            {
              url: frontMatter.image
              ? `/${frontMatter.image}`
              : "/default-image.jpg", // フォールバック画像
              width: 1200,
              height: 700,
              alt: frontMatter.title,
            },
          ],
        }}
      />
      <div className="prose prose-lg max-w-none">
        <div className="border">
          <Image
            src={frontMatter.image ? `/${frontMatter.image}` : "/default-image.JPG"}
            width={1200}
            height={700}
            alt={frontMatter.title}
            onError={(e) => {
              e.target.src = "/default-image.JPG"; // フォールバック画像
            }}
          />
        </div>
        <h1 className="mt-12">{frontMatter.title}</h1>
        <span>{frontMatter.date}</span>
        <div className="space-x-2">
          {frontMatter.categories && frontMatter.categories.length > 0 ? (
            frontMatter.categories.map((category) => (
              <span key={category}>
                <Link href={`/categories/${category}`}>{category}</Link>
              </span>
            ))
          ) : (
            <span>カテゴリーがありません</span>
          )}
        </div>
        <div>{toReactNode(content) || "記事を読み込めませんでした。"}</div>
        {/* {toc && (
          <div className="toc">
            <h2>目次</h2>
            <div dangerouslySetInnerHTML={{ __html: toc }} />
          </div>
        )} */}
      </div>
    </>
  );
};

export default Post;
