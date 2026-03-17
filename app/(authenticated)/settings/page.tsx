"use client";

import { BankAccountList } from "@/components/settings/bank-account-list";
import { CompanyInfoForm } from "@/components/settings/company-info-form";
import { StageOptionsList } from "@/components/settings/stage-options-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="시스템 설정"
        description="회사 정보, 계좌, 견적 진행단계를 관리합니다."
      />
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="company">회사 정보</TabsTrigger>
          <TabsTrigger value="accounts">계좌 관리</TabsTrigger>
          <TabsTrigger value="stages">견적 진행단계</TabsTrigger>
        </TabsList>
        <TabsContent value="company" className="mt-6">
          <CompanyInfoForm />
        </TabsContent>
        <TabsContent value="accounts" className="mt-6">
          <BankAccountList />
        </TabsContent>
        <TabsContent value="stages" className="mt-6">
          <StageOptionsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
