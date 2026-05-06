import { createBrowserRouter } from "react-router";

// Screens
import Splash from "./screens/Splash";
import Onboarding from "./screens/Onboarding";
import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Verification, { VerificationStatus } from "./screens/Verification";
import Home from "./screens/Home";
import Marketplace from "./screens/Marketplace";
import Services from "./screens/Services";
import Messages from "./screens/Messages";
import Profile from "./screens/Profile";
import Events from "./screens/Events";
import Notifications from "./screens/Notifications";
import Analytics from "./screens/Analytics";
import Settings from "./screens/Settings";
import Reputation from "./screens/Reputation";
import Alerts from "./screens/Alerts";
import Report from "./screens/Report";
import CreatePost from "./screens/CreatePost";
import CreateMarketplaceItem from "./screens/CreateMarketplaceItem";
import EditMarketplaceItem from "./screens/EditMarketplaceItem";
import CreateEvent from "./screens/CreateEvent";
import EditEvent from "./screens/EditEvent";
import CreateAlert from "./screens/CreateAlert";
import ChatScreen from "./screens/ChatScreen";
import PostDetail from "./screens/PostDetail";
import MarketplaceItemDetail from "./screens/MarketplaceItemDetail";
import EventDetail from "./screens/EventDetail";
import ServiceDetail from "./screens/ServiceDetail";
import NeighborhoodDiscovery from "./screens/NeighborhoodDiscovery";
import ProposeNeighborhood from "./screens/ProposeNeighborhood";
import HubSettings from "./screens/HubSettings";
import BrowseNeighborhoods from "./screens/BrowseNeighborhoods";
import NeighborhoodProposalStatus from "./screens/NeighborhoodProposalStatus";
import SuperAdminDashboard from "./screens/SuperAdminDashboard";
import NeighborhoodDetail from "./screens/NeighborhoodDetail";
import ForgotPassword from "./screens/ForgotPassword";
import ResetPassword from "./screens/ResetPassword";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Splash,
  },
  {
    path: "/onboarding",
    Component: Onboarding,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/verification",
    Component: Verification,
  },
  {
    path: "/verification-status",
    Component: VerificationStatus,
  },
  {
    path: "/home",
    Component: Home,
  },
  {
    path: "/marketplace",
    Component: Marketplace,
  },
  {
    path: "/services",
    Component: Services,
  },
  {
    path: "/messages",
    Component: Messages,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/events",
    Component: Events,
  },
  {
    path: "/notifications",
    Component: Notifications,
  },
  {
    path: "/analytics",
    Component: Analytics,
  },
  {
    path: "/settings",
    Component: Settings,
  },
  {
    path: "/reputation",
    Component: Reputation,
  },
  {
    path: "/alerts",
    Component: Alerts,
  },
  {
    path: "/report",
    Component: Report,
  },
  {
    path: "/create-post",
    Component: CreatePost,
  },
  {
    path: "/create-marketplace-item",
    Component: CreateMarketplaceItem,
  },
  {
    path: "/edit-marketplace-item/:itemId",
    Component: EditMarketplaceItem,
  },
  {
    path: "/create-event",
    Component: CreateEvent,
  },
  {
    path: "/edit-event/:eventId",
    Component: EditEvent,
  },
  {
    path: "/create-alert",
    Component: CreateAlert,
  },
  {
    path: "/chat/:conversationId",
    Component: ChatScreen,
  },
  {
    path: "/post/:postId",
    Component: PostDetail,
  },
  {
    path: "/marketplace-item/:itemId",
    Component: MarketplaceItemDetail,
  },
  {
    path: "/event/:eventId",
    Component: EventDetail,
  },
  {
    path: "/service/:serviceId",
    Component: ServiceDetail,
  },
  {
    path: "/neighborhood-discovery",
    Component: NeighborhoodDiscovery,
  },
  {
    path: "/propose-neighborhood",
    Component: ProposeNeighborhood,
  },
  {
    path: "/hub-settings/:neighborhoodId",
    Component: HubSettings,
  },
  {
    path: "/hub-settings",
    Component: HubSettings,
  },
  {
    path: "/neighborhoods",
    Component: BrowseNeighborhoods,
  },
  {
    path: "/proposal-status",
    Component: NeighborhoodProposalStatus,
  },
  {
    path: "/neighborhood/:neighborhoodId",
    Component: NeighborhoodDetail,
  },
  {
    path: "/super-admin-dashboard",
    Component: SuperAdminDashboard,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password/:token",
    Component: ResetPassword,
  },
]);