import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from '@/components/layout/AuthGuard.jsx';
import AppLayout from '@/components/layout/AppLayout.jsx';
import RouteErrorBoundary from '@/components/error/RouteErrorBoundary.jsx';
import CampaignLayout from '@/components/layout/CampaignLayout.jsx';
import CampaignList from '@/components/campaign/CampaignList.jsx';
import CampaignCreate from '@/components/campaign/CampaignCreate.jsx';
import CampaignHub from '@/components/campaign/CampaignHub.jsx';
import PDASetup from '@/components/pda/PDASetup.jsx';
import Strategy from '@/components/strategy/Strategy.jsx';
import ContentPlan from '@/components/content-plan/ContentPlan.jsx';
import CreativeList from '@/components/creative/CreativeList.jsx';
import CreativeEditor from '@/components/creative/CreativeEditor.jsx';
import InfluencerMatch from '@/components/influencer/InfluencerMatch.jsx';
import InfluencerDetail from '@/components/influencer/InfluencerDetail.jsx';
import Outreach from '@/components/outreach/Outreach.jsx';
import Launch from '@/components/launch/Launch.jsx';
import Monitor from '@/components/monitor/Monitor.jsx';
import { LoginPage } from '@/components/LoginPage.jsx';
import CreatorHub from '@/components/placeholder/CreatorHub.jsx';
import ContentEngine from '@/components/placeholder/ContentEngine.jsx';
import AnalyticsPage from '@/components/placeholder/AnalyticsPage.jsx';
import InfluencerPool from '@/components/placeholder/InfluencerPool.jsx';
import ContentLibrary from '@/components/placeholder/ContentLibrary.jsx';
import SettingsPage from '@/components/placeholder/SettingsPage.jsx';

export default function AppRouter() {
  return (
    <RouteErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/creator-hub" element={<CreatorHub />} />
            <Route path="/content-engine" element={<ContentEngine />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/campaigns" element={<CampaignList />} />
            <Route path="/campaigns/new" element={<CampaignCreate />} />
            <Route path="/campaigns/:id" element={<CampaignLayout />}>
              <Route index element={<CampaignHub />} />
              <Route path="pda" element={<PDASetup />} />
              <Route path="strategy" element={<Strategy />} />
              <Route path="approval" element={<Strategy initialApprovalOpen />} />
              <Route path="calendar" element={<ContentPlan />} />
              <Route path="content-plan" element={<ContentPlan />} />
              <Route path="creative" element={<CreativeList />} />
              <Route path="creative/:creativeId" element={<CreativeEditor />} />
              <Route path="influencer" element={<InfluencerMatch />} />
              <Route path="influencers" element={<InfluencerMatch />} />
              <Route path="influencers/:profileId" element={<InfluencerDetail />} />
              <Route path="outreach" element={<Outreach />} />
              <Route path="launch" element={<Launch />} />
              <Route path="monitor" element={<Monitor />} />
            </Route>
            <Route path="/content-library" element={<ContentLibrary />} />
            <Route path="/influencer-pool" element={<InfluencerPool />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/campaigns" replace />} />

            {/* V1 → V2 리다이렉트 */}
            <Route path="/AI-PLAN/*" element={<Navigate to="/campaigns" replace />} />
            <Route path="/access-management" element={<Navigate to="/settings" replace />} />

            {/* Catch-all: 알 수 없는 경로 → 캠페인 목록 */}
            <Route path="*" element={<Navigate to="/campaigns" replace />} />
          </Route>
        </Route>
      </Routes>
    </RouteErrorBoundary>
  );
}
