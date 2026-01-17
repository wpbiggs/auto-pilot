import "@/index.css"
import { ErrorBoundary, Show, type ParentProps, Suspense } from "solid-js"
import { MetaProvider } from "@solidjs/meta"
import { Font } from "@opencode-ai/ui/font"
import { MarkedProvider } from "@opencode-ai/ui/context/marked"
import { DiffComponentProvider } from "@opencode-ai/ui/context/diff"
import { CodeComponentProvider } from "@opencode-ai/ui/context/code"
import { Diff } from "@opencode-ai/ui/diff"
import { Code } from "@opencode-ai/ui/code"
import { ThemeProvider } from "@opencode-ai/ui/theme"
import { GlobalSyncProvider } from "@/context/global-sync"
import { WorkflowProvider } from "@/context/workflow"
import { PermissionProvider } from "@/context/permission"
import { LayoutProvider } from "@/context/layout"
import { GlobalSDKProvider } from "@/context/global-sdk"
import { ServerProvider, useServer } from "@/context/server"
import { NotificationProvider } from "@/context/notification"
import { DialogProvider } from "@opencode-ai/ui/context/dialog"
import { CommandProvider } from "@/context/command"
import { ErrorPage } from "./pages/error"
import { AutoDevFlow } from "@/flows/auto-dev"

const Loading = () => <div class="size-full flex items-center justify-center text-text-weak">Loading...</div>

declare global {
  interface Window {
    __OPENCODE__?: { updaterEnabled?: boolean }
  }
}

export function AppBaseProviders(props: ParentProps) {
  return (
    <MetaProvider>
      <Font />
      <ThemeProvider>
        <ErrorBoundary fallback={(error) => <ErrorPage error={error} />}>
          <DialogProvider>
            <MarkedProvider>
              <DiffComponentProvider component={Diff}>
                <CodeComponentProvider component={Code}>{props.children}</CodeComponentProvider>
              </DiffComponentProvider>
            </MarkedProvider>
          </DialogProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </MetaProvider>
  )
}

function ServerKey(props: ParentProps) {
  const server = useServer()
  return (
    <Show when={server.url} keyed>
      {props.children}
    </Show>
  )
}

export function AppInterface(props: { defaultUrl?: string }) {
  const defaultServerUrl = () => {
    if (props.defaultUrl) return props.defaultUrl
    if (location.hostname.includes("opencode.ai")) return "http://localhost:4096"
    if (import.meta.env.DEV) {
      const host = import.meta.env.VITE_OPENCODE_SERVER_HOST ?? "localhost"
      const port = import.meta.env.VITE_OPENCODE_SERVER_PORT ?? "4096"
      const protocol = host.includes(".app.github.dev") ? "https" : "http"
      return `${protocol}://${host}${port !== "443" && port !== "80" ? `:${port}` : ""}`
    }

    return window.location.origin
  }

  return (
    <ServerProvider defaultUrl={defaultServerUrl()}>
      <ServerKey>
        <GlobalSDKProvider>
          <GlobalSyncProvider>
            <PermissionProvider>
              <LayoutProvider>
                <NotificationProvider>
                  <CommandProvider>
                    <WorkflowProvider>
                      <Suspense fallback={<Loading />}>
                        <AutoDevFlow />
                      </Suspense>
                    </WorkflowProvider>
                  </CommandProvider>
                </NotificationProvider>
              </LayoutProvider>
            </PermissionProvider>
          </GlobalSyncProvider>
        </GlobalSDKProvider>
      </ServerKey>
    </ServerProvider>
  )
}
