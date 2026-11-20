import { PageLayout } from "@dynatrace/strato-components/layouts";
import React from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { AdMapping } from "./pages/AdMapping";
import { Explorer } from "./pages/Explorer";
import { GroupMembers } from "./pages/GroupMembers";

export const App = () => {
  return (
    <PageLayout>
      <PageLayout.Header>
        <Header />
      </PageLayout.Header>
      <PageLayout.Content>
        <Routes>
          <Route path="/" element={<Explorer />} />
          <Route path="/ad-mapping" element={<AdMapping />} />
          <Route path="/group-members" element={<GroupMembers />} />
        </Routes>
      </PageLayout.Content>
    </PageLayout>
  );
};
