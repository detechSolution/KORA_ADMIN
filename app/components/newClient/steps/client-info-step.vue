<script setup lang="ts">
const form = defineModel<any>({ required: true });
</script>

<template>
  <section class="space-y-6">
    <div class="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 shadow-sm">
      <div class="grid grid-cols-1 gap-4">
        <base-input
          v-model="form.fullName"
          name="fullName"
          label="Full Name*"
          placeholder="Enter name of the user"
        />
        <base-input
          v-model="form.phone"
          name="phone"
          label="Phone Number"
          placeholder="Enter phone number"
        />
        <base-input
          v-model="form.email"
          name="email"
          label="Email Address*"
          placeholder="Enter email address"
          type="email"
        />
      </div>
    </div>
  </section>
</template>
