import type { Metadata } from "next";
import { ApolloWrapper } from "@/lib/apollo-provider";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Depot — GraphQL E-commerce POC",
  description:
    "A proof-of-concept storefront built with Next.js, Apollo GraphQL, and PostgreSQL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <SiteHeader />
          <main className="container">{children}</main>
        </ApolloWrapper>
      </body>
    </html>
  );
}
