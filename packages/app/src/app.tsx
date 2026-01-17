import "@/index.css"
import { ErrorBoundary, Show, lazy, type ParentProps } from "solid-js"
import { Router, Route, Navigate } from "@solidjs/router"
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
import { TerminalProvider } from "@/context/terminal"
import { PromptProvider } from "@/context/prompt"
import { FileProvider } from "@/context/file"
import { NotificationProvider } from "@/context/notification"
import { DialogProvider } from "@opencode-ai/ui/context/dialog"
import { CommandProvider } from "@/context/command"
import { Logo } from "@opencode-ai/ui/logo"
import Layout from "@/pages/layout"
import DirectoryLayout from "@/pages/directory-layout"
import { ErrorPage } from "./pages/error"
import { iife } from "@opencode-ai/util/iife"
import { Suspense } from "solid-js"

const Home = lazy(() => import("@/pages/home"))
const Session = lazy(() => import("@/pages/session"))
const Workspace = lazy(() => import("@/pages/workspace"))
const Ideation = lazy(() => import("@/pages/ideation"))
const Roadmap = lazy(() => import("@/pages/roadmap"))
const Kanban = lazy(() => import("@/pages/kanban"))
const Agents = lazy(() => import("@/pages/agents"))
const Insights = lazy(() => import("@/pages/insights"))
const TaskWizard = lazy(() => import("@/pages/task-wizard"))
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
            <Router
              root={(props) => (
                <PermissionProvider>
                  <LayoutProvider>
                    <NotificationProvider>
                      <CommandProvider>
                        <WorkflowProvider>
                          <Layout>{props.children}</Layout>
                        </WorkflowProvider>
                      </CommandProvider>
                    </NotificationProvider>
                  </LayoutProvider>
                </PermissionProvider>
              )}
            >
              <Route
                path="/"
                component={() => (
                  <Suspense fallback={<Loading />}>
                    <Home />
                  </Suspense>
                )}
              />
              <Route path="/:dir" component={DirectoryLayout}>
                <Route path="/" component={() => <Navigate href="workspace" />} />
                <Route
                  path="/workspace"
                  component={() => (
                    <Suspense fallback={<Loading />}>
                      <Workspace />
                    </Suspense>
                  )}
                />
                <Route
                  path="/session/:id?"
                  component={() => (
                    <TerminalProvider>
                      <FileProvider>
                        <PromptProvider>
                          <Suspense fallback={<Loading />}>
                            <Session />
                          </Suspense>
                        </PromptProvider>
                      </FileProvider>
                    </TerminalProvider>
                  )}
                />
                <Route
                  path="/ideation"
                  component={() => (
                    <Suspense fallback={<Loading />}>
                      <Ideation />
                    </Suspense>
                  )}
                />
                <Route
                  path="/roadmap"
                  component={() => (
                    <Suspense fallback={<Loading />}>
                      <Roadmap />
                    </Suspense>
                  )}
                />
                <Route
                  path="/kanban"
                  component={() => (
                    <Suspense fallback={<Loading />}>
                      <Kanban />
                    </Suspense>
                  )}
                />
                <Route
                  path="/agents"
                  component={() => (
                    <Suspense fallback={<Loading />}>
                      <Agents />
                    </Suspense>
                  )}
                />
                <Route
                  path="/insights"
                  component={() => (
                    <Suspense fallback={<Loading />}>
                      <Insights />
                    </Suspense>
                  )}
                />
                <Route
                  path="/task-wizard"
                  component={() => (
                    <Suspense fallback={<Loading />}>
                      <TaskWizard />
                    </Suspense>
                  )}
                />
              </Route>
            </Router>
          </GlobalSyncProvider>
        </GlobalSDKProvider>
      </ServerKey>
    </ServerProvider>
  )
}
