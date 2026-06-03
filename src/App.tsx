import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { SyncProfile } from "@/components/SyncProfile";
import { ADMIN_ENABLED } from "@/config";
import { AuthProvider, useAuth } from "@/store/auth";
import { UserEventsProvider } from "@/store/userEvents";
import { MembershipProvider } from "@/store/membership";
import { EventsProvider } from "@/store/events";
import { DealsProvider } from "@/store/deals";
import { VenuesProvider } from "@/store/venues";
import { CommunityGroupsProvider } from "@/store/communityGroups";
import { ChatProvider } from "@/store/chat";
import { ToastProvider } from "@/store/toast";
import { ProfileProvider } from "@/store/profile";
import { NotificationsProvider } from "@/store/notifications";
import { PromotionsProvider } from "@/store/promotions";
import { KnowledgeProvider } from "@/store/knowledge";

// Route-level code-splitting — each page loads on demand.
const Home = lazy(() => import("@/pages/Home").then((m) => ({ default: m.Home })));
const Events = lazy(() => import("@/pages/Events").then((m) => ({ default: m.Events })));
const EventDetail = lazy(() => import("@/pages/EventDetail").then((m) => ({ default: m.EventDetail })));
const Deals = lazy(() => import("@/pages/Deals").then((m) => ({ default: m.Deals })));
const DealDetail = lazy(() => import("@/pages/DealDetail").then((m) => ({ default: m.DealDetail })));
const Venues = lazy(() => import("@/pages/Venues").then((m) => ({ default: m.Venues })));
const Explore = lazy(() => import("@/pages/Explore").then((m) => ({ default: m.Explore })));
const VenueDetail = lazy(() => import("@/pages/VenueDetail").then((m) => ({ default: m.VenueDetail })));
const Knowledge = lazy(() => import("@/pages/Knowledge").then((m) => ({ default: m.Knowledge })));
const KnowledgeDetail = lazy(() => import("@/pages/KnowledgeDetail").then((m) => ({ default: m.KnowledgeDetail })));
const Community = lazy(() => import("@/pages/Community").then((m) => ({ default: m.Community })));
const ChatThread = lazy(() => import("@/pages/ChatThread").then((m) => ({ default: m.ChatThread })));
const AskAssistant = lazy(() => import("@/pages/AskAssistant").then((m) => ({ default: m.AskAssistant })));
const Profile = lazy(() => import("@/pages/Profile").then((m) => ({ default: m.Profile })));
const Membership = lazy(() => import("@/pages/Membership").then((m) => ({ default: m.Membership })));
const Notifications = lazy(() => import("@/pages/Notifications").then((m) => ({ default: m.Notifications })));
const Admin = lazy(() => import("@/pages/Admin").then((m) => ({ default: m.Admin })));
const SignIn = lazy(() => import("@/pages/SignIn").then((m) => ({ default: m.SignIn })));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword").then((m) => ({ default: m.UpdatePassword })));
const Privacy = lazy(() => import("@/pages/Privacy").then((m) => ({ default: m.Privacy })));
const NotFound = lazy(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })));

function Loading() {
  return (
    <div className="grid h-[100dvh] place-items-center bg-sand">
      <Loader2 className="h-6 w-6 animate-spin text-wine" strokeWidth={2} />
    </div>
  );
}

/** Admin is visible while ADMIN_ENABLED (dev) or to real admins (profile.is_admin). */
function AdminRoute() {
  const { isAdmin } = useAuth();
  return ADMIN_ENABLED || isAdmin ? <Admin /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationsProvider>
            <PromotionsProvider>
              <MembershipProvider>
                <EventsProvider>
                <DealsProvider>
                <KnowledgeProvider>
                <VenuesProvider>
                <CommunityGroupsProvider>
                <UserEventsProvider>
                  <ChatProvider>
                    <SyncProfile />
                    <Suspense fallback={<Loading />}>
                      <Routes>
                        <Route element={<Layout />}>
                          <Route path="/" element={<Home />} />
                          <Route path="/events" element={<Events />} />
                          <Route path="/events/:id" element={<EventDetail />} />
                          <Route path="/deals" element={<Deals />} />
                          <Route path="/deals/:id" element={<DealDetail />} />
                          <Route path="/explore" element={<Explore />} />
                          <Route path="/venues" element={<Venues />} />
                          <Route path="/venues/:id" element={<VenueDetail />} />
                          <Route path="/knowledge" element={<Knowledge />} />
                          <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
                          <Route path="/community" element={<Community />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/membership" element={<Membership />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/admin" element={<AdminRoute />} />
                          <Route path="*" element={<NotFound />} />
                        </Route>
                        {/* Full-screen pages (no tab bar) */}
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/update-password" element={<UpdatePassword />} />
                        <Route path="/community/ask" element={<AskAssistant />} />
                        <Route path="/community/:eventId" element={<ChatThread />} />
                      </Routes>
                    </Suspense>
                  </ChatProvider>
                </UserEventsProvider>
                </CommunityGroupsProvider>
                </VenuesProvider>
                </KnowledgeProvider>
                </DealsProvider>
                </EventsProvider>
              </MembershipProvider>
            </PromotionsProvider>
          </NotificationsProvider>
        </ProfileProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
