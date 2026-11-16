import type { PluginSurfaceProps } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ARTIFACT_ENTRYPOINT, allowlistSettings, normalizePrefixes } from "../shared/settings";

export function AllowlistSettingsScreen({ theme, layout }: PluginSurfaceProps) {
  const state = useSettings(allowlistSettings);
  const savedText = state.status === "ready" ? state.values.cwdPrefixes.join("\n") : "";
  const savedAll = state.status === "ready" ? state.values.applyToAll : false;
  const [draft, setDraft] = useState(savedText);
  const [applyToAll, setApplyToAll] = useState(savedAll);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDraft(savedText);
  }, [savedText]);
  useEffect(() => {
    setApplyToAll(savedAll);
  }, [savedAll]);

  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: theme.colors.surface0 },
      content: { padding: layout.compact ? 16 : 24, gap: layout.compact ? 10 : 14 },
      title: { color: theme.colors.foreground, fontSize: layout.compact ? 18 : 20, fontWeight: "600" as const },
      heading: { color: theme.colors.foreground, fontWeight: "600" as const },
      text: { color: theme.colors.foreground },
      muted: { color: theme.colors.foregroundMuted },
      code: { color: theme.colors.foreground, fontFamily: "monospace" },
      switchRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 12,
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface1,
      },
      switchLabel: { flex: 1, gap: 2 },
      track: {
        width: 40,
        height: 24,
        borderRadius: 12,
        padding: 2,
        justifyContent: "center" as const,
        backgroundColor: applyToAll ? theme.colors.accent : theme.colors.surface2,
      },
      thumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignSelf: applyToAll ? ("flex-end" as const) : ("flex-start" as const),
        backgroundColor: applyToAll ? theme.colors.accentForeground : theme.colors.foregroundMuted,
      },
      input: {
        minHeight: 120,
        padding: 10,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface1,
        color: theme.colors.foreground,
        fontFamily: "monospace",
        textAlignVertical: "top" as const,
      },
      inactive: { opacity: 0.5 },
      row: { flexDirection: "row" as const, gap: 10, flexWrap: "wrap" as const },
      button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: theme.colors.accent },
      buttonDisabled: { opacity: 0.5 },
      buttonText: { color: theme.colors.accentForeground },
      secondary: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      error: { color: theme.colors.statusDanger },
      success: { color: theme.colors.statusSuccess },
    }),
    [theme, layout.compact, applyToAll],
  );

  const lines = draft.split("\n").map((line) => line.trim()).filter((line) => line !== "");
  const normalized = normalizePrefixes(lines);
  const rejected = lines.filter((line) => !line.startsWith("/"));
  const dirty = normalized.join("\n") !== savedText || applyToAll !== savedAll;

  async function save() {
    if (state.status !== "ready") return;
    setNotice(null);
    const ok = await state.save({ applyToAll, cwdPrefixes: normalized }, state.revision);
    if (ok) setNotice("Saved. Applies to Claude agents opened from now on; reload a running agent to apply it there.");
  }

  function discard() {
    setDraft(savedText);
    setApplyToAll(savedAll);
    setNotice(null);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Claude Artifact entrypoint</Text>
      <Text style={styles.muted}>
        Selected Claude agents launch with{" "}
        <Text style={styles.code}>CLAUDE_CODE_ENTRYPOINT={ARTIFACT_ENTRYPOINT}</Text>, which gives them the
        Artifact tool. Other providers are never affected.
      </Text>

      {state.status === "loading" ? <Text style={styles.muted}>Loading settings…</Text> : null}
      {state.status === "error" ? <Text style={styles.error}>Could not load settings: {state.error}</Text> : null}
      {state.status === "invalid" ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.error}>Stored settings are invalid: {state.error}</Text>
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => void state.reset()}>
            <Text style={styles.text}>Reset to defaults</Text>
          </Pressable>
        </View>
      ) : null}

      {state.status === "ready" ? (
        <>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Apply to all Claude agents"
            accessibilityState={{ checked: applyToAll }}
            style={styles.switchRow}
            onPress={() => {
              setApplyToAll((value) => !value);
              setNotice(null);
            }}
          >
            <View style={styles.switchLabel}>
              <Text style={styles.heading}>Apply to all Claude agents</Text>
              <Text style={styles.muted}>Every Claude agent gets the Artifact tool. The list below is ignored.</Text>
            </View>
            <View style={styles.track}>
              <View style={styles.thumb} />
            </View>
          </Pressable>

          <View style={[{ gap: 8 }, applyToAll && styles.inactive]}>
            <Text style={styles.heading}>Allowed directories</Text>
            <Text style={styles.muted}>
              A Claude agent whose working directory is one of these paths, or inside one, gets the Artifact tool. One
              absolute path per line. An empty list affects no agents.
            </Text>
            <TextInput
              accessibilityLabel="Allowed working directory prefixes, one per line"
              style={styles.input}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={"/absolute/path/to/project\n/another/project"}
              placeholderTextColor={theme.colors.foregroundMuted}
              value={draft}
              onChangeText={(value) => {
                setDraft(value);
                setNotice(null);
              }}
            />
            {rejected.length > 0 ? (
              <Text style={styles.error}>Ignored (not absolute): {rejected.join(", ")}</Text>
            ) : null}
          </View>

          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save settings"
              accessibilityState={{ disabled: !dirty || state.saving }}
              disabled={!dirty || state.saving}
              style={[styles.button, (!dirty || state.saving) && styles.buttonDisabled]}
              onPress={() => void save()}
            >
              <Text style={styles.buttonText}>{state.saving ? "Saving…" : "Save"}</Text>
            </Pressable>
            {dirty ? (
              <Pressable accessibilityRole="button" style={styles.secondary} onPress={discard}>
                <Text style={styles.text}>Discard</Text>
              </Pressable>
            ) : null}
          </View>
          {state.saveError ? <Text style={styles.error}>{state.saveError}</Text> : null}
          {notice ? <Text style={styles.success}>{notice}</Text> : null}
        </>
      ) : null}
    </ScrollView>
  );
}
