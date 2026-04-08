<script setup lang="ts">
definePageMeta({
  auth: true,
  layout: "dashboard",
  permission: "REPORTS",
});
</script>

<template>
  <div class="flex flex-col">
    <base-page-header>
      <template #title>
        Reports
      </template>
      <template #description>
        View analytics and performance reports.
      </template>
    </base-page-header>
    <div class="bg-card border-x border-b border-border rounded-b-xl shadow-sm p-6">
      <div class="mx-auto max-w-4xl py-10">
        <under-construction
          title="Reports are on the way"
          description="We're building reporting dashboards to help you track performance and billing. Check back soon."
          hint="Want to prioritize a specific report? Reach out to the team."
        />
      </div>
    </div>
  </div>
</template>
