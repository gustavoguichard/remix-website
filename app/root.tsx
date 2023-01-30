import * as React from "react";
import {
  Meta,
  Links,
  useCatch,
  useMatches,
  Outlet,
  useLoaderData,
} from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/node";
import { load as loadFathom } from "fathom-client";
import tailwind from "~/styles/tailwind.css";
import bailwind from "~/styles/bailwind.css";
import { Body } from "~/components/body";
import {
  removeTrailingSlashes,
  ensureSecure,
  isProductionHost,
} from "~/utils/http.server";
import { ColorSchemeScript, useColorScheme } from "~/utils/color-scheme";
import { parseColorScheme } from "~/utils/color-scheme.server";
import iconsHref from "~/icons.svg";
import { canUseDOM } from "~/utils/misc";

declare global {
  var __env: {
    NODE_ENV: "development" | "production";
  };
}

export async function loader({ request }: LoaderArgs) {
  await ensureSecure(request);
  await removeTrailingSlashes(request);
  let env = {
    NODE_ENV: process.env.NODE_ENV,
  };

  let isDevHost = !isProductionHost(request);
  let url = new URL(request.url);

  let colorScheme = await parseColorScheme(request);

  return {
    colorScheme,
    noIndex:
      isDevHost ||
      url.pathname === "/docs/en/v1/api/remix" ||
      url.pathname === "/docs/en/v1/api/conventions",
    env,
  };
}

export let unstable_shouldReload = () => false;

export function links() {
  return [
    {
      rel: "preload",
      as: "font",
      href: "/font/founders-grotesk-bold.woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      as: "font",
      href: "https://fonts.gstatic.com/s/inter/v8/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      as: "font",
      href: "https://fonts.gstatic.com/s/sourcecodepro/v20/HI_SiYsKILxRpg3hIP6sJ7fM7PqlPevWnsUnxg.woff2",
      crossOrigin: "anonymous",
    },
    { rel: "stylesheet", href: tailwind },
    { rel: "stylesheet", href: bailwind },
  ];
}

interface DocumentProps {
  title?: string;
  forceDark?: boolean;
  darkBg?: string;
  noIndex: boolean;
  children: React.ReactNode;
}

const Document: React.FC<DocumentProps> = ({
  children,
  title,
  forceDark,
  darkBg,
  noIndex,
}) => {
  let colorScheme = useColorScheme();
  return (
    <html
      lang="en"
      className={forceDark || colorScheme === "dark" ? "dark" : undefined}
      data-theme={forceDark ? "dark" : colorScheme}
    >
      <head>
        <ColorSchemeScript forceConsistentTheme={forceDark} />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#121212" />
        {noIndex && <meta name="robots" content="noindex" />}
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <link
          rel="icon"
          href="/favicon-light.1.png"
          type="image/png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/favicon-dark.1.png"
          type="image/png"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Source+Code+Pro:wght@400;600&family=JetBrains+Mono:wght@600;700&display=auto"
          rel="stylesheet"
        />

        <Links />
        <Meta />
        {title && <title data-title-override="">{title}</title>}
      </head>

      <Body forceDark={forceDark} darkBg={darkBg}>
        {children}
      </Body>
    </html>
  );
};

export default function App() {
  let matches = useMatches();
  let { noIndex, env } = useLoaderData<typeof loader>();
  let forceDark = matches.some((match) => match.handle?.forceDark);

  React.useEffect(() => {
    if (env.NODE_ENV !== "development") {
      loadFathom("IRVDGCHK", {
        url: "https://cdn.usefathom.com/script.js",
        spa: "history",
        excludedDomains: ["localhost"],
      });
    }
  }, [env.NODE_ENV]);

  return (
    <Document noIndex={noIndex} forceDark={forceDark}>
      <Outlet />
      <img
        src={iconsHref}
        alt=""
        hidden
        // this img tag simply forces the icons to be loaded at a higher
        // priority than the scripts (chrome only for now)
        // @ts-expect-error
        fetchpriority="high"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__env = ${JSON.stringify(env)};`,
        }}
      />
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  if (!canUseDOM) {
    console.error(error);
  }
  return (
    <Document noIndex title="Error" forceDark darkBg="bg-red-brand">
      <div className="flex flex-col justify-center flex-1 text-white">
        <div className="leading-none text-center">
          <h1 className="text-[25vw]">Error</h1>
          <div className="text-d-h3">
            Something went wrong! Please try again later.
          </div>
        </div>
      </div>
    </Document>
  );
}

export function CatchBoundary() {
  let caught = useCatch();
  return (
    <Document
      noIndex
      title={caught.statusText}
      forceDark
      darkBg="bg-blue-brand"
    >
      <div className="flex flex-col justify-center flex-1 text-white">
        <div className="leading-none text-center">
          <h1 className="font-mono text-[25vw]">{caught.status}</h1>
          <a
            className="inline-block text-[8vw] underline"
            href={`https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${caught.status}`}
          >
            {caught.statusText}
          </a>
        </div>
      </div>
    </Document>
  );
}
