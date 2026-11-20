import { today } from "@internationalized/date";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
// eslint-disable-next-line test/no-import-node-test -- Follow the existing Node test runner.
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { computed, nextTick, reactive, ref, watch } from "vue";
import * as z from "zod";

function loadScript(path, bindings, names) {
  let source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  if (source.includes("<script setup"))
    source = source.split("<script setup lang=\"ts\">")[1].split("</script>")[0];
  source = source
    .replace(/^import[\s\S]*?from "[^"]+";\r?\n/gm, "")
    .replace(/^export /gm, "");
  return runInNewContext(
    `${stripTypeScriptTypes(source)}\n({ ${names.join(", ")} });`,
    { computed, reactive, ref, watch, ...bindings },
  );
}
const utils = loadScript("app/utils/pass-invitations.ts", { today, z }, [
  "invitationSchema",
  "invitationResultSchema",
  "inviteeStatus",
]);
const dates = { fromDate: "2099-11-20" };
const passEndDate = "2099-11-22";
const guest = { fullName: " Jane Doe ", email: " JANE@example.com " };

test("guest validation requires names, valid distinct emails, and a valid start date", () => {
  const { invitationSchema } = utils;
  for (const guests of [
    [],
    [{ ...guest, fullName: " " }],
    [{ ...guest, email: "invalid" }],
    [guest, { ...guest, email: "jane@example.com" }],
  ]) {
    assert.equal(
      invitationSchema.safeParse({ ...dates, guests }).success,
      false,
    );
  }
  assert.equal(
    invitationSchema.safeParse({ fromDate: "2099-02-30", guests: [guest] })
      .success,
    false,
  );
  const valid = invitationSchema.parse({ ...dates, guests: [guest] });
  assert.equal(valid.guests[0].fullName, "Jane Doe");
  assert.equal(valid.guests[0].email, "jane@example.com");
});

function setupModal() {
  const props = reactive({
    open: true,
    pass: { id: 9, numberOfDays: 3 },
    loading: false,
    result: null,
  });
  const events = [];
  const state = loadScript(
    "app/components/offerings/send-invitation-modal.vue",
    {
      ...utils,
      invitationToday: () => "2026-11-20",
      defineProps: () => props,
      defineEmits: () => (event, payload) => events.push({ event, payload }),
    },
    ["form", "handleSendInvitation"],
  );
  return { ...state, props, events };
}

test("start date and normalized guests are sent without an end date", async () => {
  const state = setupModal();
  state.form.fromDate = dates.fromDate;
  await nextTick();

  state.form.guests = [guest];
  await state.handleSendInvitation();
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].payload.guests[0].fullName, "Jane Doe");
  assert.equal("toDate" in state.events[0].payload, false);
  assert.equal(state.events[0].payload.passId, 9);
});

test("invalid and busy forms do not send invitations", async () => {
  const state = setupModal();
  await state.handleSendInvitation();
  assert.equal(state.events.length, 0);
  Object.assign(state.form, dates, { guests: [guest] });
  state.props.loading = true;
  await state.handleSendInvitation();
  assert.equal(state.events.length, 0);
});

test("partial success removes granted guests and preserves skipped guests for correction", async () => {
  const state = setupModal();
  state.form.guests = [
    guest,
    { fullName: "Member", email: "member@example.com" },
  ];
  state.props.result = {
    granted: [{ email: "jane@example.com", sentEmail: true }],
    skipped: [{ email: "member@example.com", reason: "Already a member" }],
  };
  await nextTick();
  assert.equal(state.form.guests.length, 1);
  assert.equal(state.form.guests[0].email, "member@example.com");
});

const invitee = {
  id: 8,
  user: { fullName: "Jane Doe", email: "jane@example.com" },
  startsOn: dates.fromDate,
  endsOn: passEndDate,
  status: "active",
};
function setupInvitees(updateInvitee, allowed = true) {
  const notices = [];
  const props = reactive({ open: false, pass: { id: 9 } });
  return {
    notices,
    ...loadScript(
      "app/components/offerings/pass-invitees.vue",
      {
        ...utils,
        invitationToday: () => "2026-11-20",
        defineProps: () => props,
        defineEmits: () => () => {},
        useKoraPassesStore: () => ({
          updateInvitee,
          getInvitees: async () => ({ data: [invitee], meta: { total: 1 } }),
        }),
        usePermission: () => ({ can: () => allowed }),
        PERMISSIONS_KORA_PASSES: { UPDATE: "offerings.kora_passes.update" },
        useNotification: () => ({
          success: value => notices.push(value),
          error: value => notices.push(value),
        }),
        getApiErrorMessage: error => error.message,
      },
      [
        "loadInvitees",
        "confirmCancellation",
        "filteredInvitees",
        "invitees",
        "search",
        "statusFilter",
        "dateRange",
        "savingId",
        "cancelError",
        "cancelTarget",
        "emailGuest",
        "internalReason",
        "props",
      ],
    ),
  };
}

test("cancellation defaults to emailing, includes internal reason and honors opt-out", async () => {
  const payloads = [];
  const state = setupInvitees(async (id, payload) => {
    payloads.push({ id, payload });
    return { sentEmail: true };
  });
  state.cancelTarget.value = invitee;
  state.emailGuest.value = true;
  assert.equal(state.emailGuest.value, true);
  state.emailGuest.value = true;
  state.internalReason.value = " Wrong guest ";
  await state.confirmCancellation();
  assert.equal(payloads[0].id, 8);
  assert.equal(payloads[0].payload.status, "cancelled");
  assert.equal(payloads[0].payload.emailGuest, true);
  assert.equal(payloads[0].payload.notes, "Wrong guest");
  assert.equal(state.cancelTarget.value, null);
});

test("invitee table filters search, status, and overlapping date ranges on each page", () => {
  const state = setupInvitees(async () => ({ sentEmail: true }));
  state.invitees.value = [
    invitee,
    {
      ...invitee,
      id: 9,
      user: { fullName: "Ron Doe", email: "ron@example.com" },
      startsOn: "2026-11-18",
      endsOn: "2026-11-19",
    },
    {
      ...invitee,
      id: 10,
      user: { fullName: "Jane Cancelled", email: "cancelled@example.com" },
      status: "cancelled",
    },
  ];
  state.search.value = "RON@EXAMPLE.COM";
  assert.deepEqual(
    state.filteredInvitees.value.map(row => row.id),
    [9],
  );
  state.search.value = "";
  state.statusFilter.value = "upcoming";
  state.dateRange.value = { start: "2026-11-19", end: "2026-11-21" };
  assert.deepEqual(
    state.filteredInvitees.value.map(row => row.id),
    [8],
  );
  state.statusFilter.value = "cancelled";
  state.dateRange.value = { start: null, end: null };
  assert.deepEqual(
    state.filteredInvitees.value.map(row => row.id),
    [10],
  );
});

test("failed changes keep the editor open and permission checks prevent requests", async () => {
  const state = setupInvitees(async () => {
    throw new Error("Cannot update");
  });
  state.cancelTarget.value = invitee;
  state.emailGuest.value = true;
  await state.confirmCancellation();
  assert.equal(state.cancelTarget.value.id, 8);
  assert.equal(state.savingId.value, null);
  assert.equal(state.cancelError.value, "Cannot update");
  const denied = setupInvitees(() => assert.fail("Must not submit"), false);
  denied.cancelTarget.value = invitee;
  await denied.confirmCancellation();
});

test("email failures report that the pass update was saved", async () => {
  const state = setupInvitees(async () => ({ sentEmail: false }));
  state.cancelTarget.value = invitee;
  state.emailGuest.value = true;
  await state.confirmCancellation();
  assert.equal(state.cancelTarget.value, null);
  assert.equal(state.notices[0].title, "Cancelled; email not sent");
});

test("cancelled and future passes display their actual status", () => {
  assert.equal(
    utils.inviteeStatus("cancelled", dates.fromDate, "2099-11-22"),
    "Cancelled",
  );
  assert.equal(
    utils.inviteeStatus("active", dates.fromDate, "2099-11-22"),
    "Upcoming",
  );
  assert.equal(
    utils.inviteeStatus("active", "2000-01-01", "2000-01-02"),
    "Expired",
  );
});

test("store sends named guests, returns per-guest outcomes, and uses paginated invitation endpoints", async () => {
  const requests = [];
  const outcome = {
    granted: [
      { email: "jane@example.com", userId: 12, userPassId: 8, sentEmail: true },
    ],
    skipped: [],
  };
  const { useKoraPassesStore } = loadScript(
    "app/stores/kora-passes.ts",
    {
      defineStore: (name, setup) => setup,
      URLSearchParams,
      getHttp: () => ({
        post: async (url, payload) => {
          requests.push({ url, payload });
          return outcome;
        },
        get: async (url) => {
          requests.push({ url });
          return { data: [], meta: { total: 0 } };
        },
        patch: async (url, payload) => {
          requests.push({ url, payload });
          return { sentEmail: true };
        },
      }),
      API_ENDPOINTS: {
        KORA_PASSES: {
          INVITE: id => `/passes/${id}/invite`,
          INVITEES: "/passes/user-passes",
          UPDATE_INVITEE: id => `/passes/user-passes/${id}`,
          CREATE: "/passes",
        },
      },
    },
    ["useKoraPassesStore"],
  );
  const store = useKoraPassesStore();
  assert.equal(await store.invitePass(9, [guest], dates.fromDate), outcome);
  assert.equal(requests[0].url, "/passes/9/invite");
  assert.equal(requests[0].payload.guests[0].fullName, guest.fullName);
  assert.equal("emails" in requests[0].payload, false);
  assert.equal(store.loading.value, false);
  await store.getInvitees(9, 2);
  assert.equal(
    requests[1].url,
    "/passes/user-passes?passId=9&page=2&limit=100",
  );
  await store.updateInvitee(8, { status: "cancelled", emailGuest: false });
  assert.equal(requests[2].url, "/passes/user-passes/8");
  assert.equal(requests[2].payload.emailGuest, false);
  await store.createPass({ isInvitation: true, price: 999 });
  assert.equal("price" in requests[3].payload, false);
});

test("invitation creation needs no price while regular passes still require one", () => {
  const { schema, form } = loadScript(
    "app/pages/offerings/create-passes.vue",
    {
      z,
      useRouter: () => ({}),
      definePageMeta: () => {},
      useNotification: () => ({ success: () => {}, error: () => {} }),
      useKoraPassesStore: () => ({}),
    },
    ["schema", "form"],
  );
  const values = {
    ...form,
    name: "Invitation",
    validity: 3,
    description: "Full entry",
    isInvitation: true,
  };
  assert.equal(schema.safeParse(values).success, true);
  assert.equal(
    schema.safeParse({ ...values, isInvitation: false }).success,
    false,
  );
  assert.equal(
    schema.safeParse({ ...values, isInvitation: false, price: 0 }).success,
    true,
  );
});
