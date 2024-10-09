/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'http', // or 'https'
  //       hostname: 'localhost',
  //       port: '3000', // 省略可
  //       pathname: '/**', // 必要に応じて変更
  //     },
  //   ],
  // },
};

export default nextConfig;
