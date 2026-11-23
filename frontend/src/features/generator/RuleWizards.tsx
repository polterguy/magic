import { SandboxTabState } from './hooks/useSandboxTab';
import { mergeSlots } from './slots';
import { RoleRule } from './types';
import DbAccessWizard from './wizards/DbAccessWizard';
import DynamicSlotsWizard from './wizards/DynamicSlotsWizard';
import EmailWizard from './wizards/EmailWizard';
import ExecuteFilesWizard from './wizards/ExecuteFilesWizard';
import FilesAccessWizard from './wizards/FilesAccessWizard';
import GroupWizard from './wizards/GroupWizard';
import HttpAccessWizard from './wizards/HttpAccessWizard';
import ImagesWizard from './wizards/ImagesWizard';
import LoggingWizard from './wizards/LoggingWizard';
import { TIER2_WIZARDS } from './wizardSpecs';

// The capability wizard open on a role rule, if any, merging what it grants into the rule's slots.
export default function RuleWizards(
  props: Readonly<{ sandbox: SandboxTabState; rule: RoleRule; index: number }>,
) {
  const { rule, index } = props;
  const { wizard, setWizard, updateRule } = props.sandbox;
  return (
    <>
      {wizard?.index === index && wizard.kind === 'db' && (
        <DbAccessWizard
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
      {wizard?.index === index && wizard.kind === 'http' && (
        <HttpAccessWizard
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
      {wizard?.index === index && wizard.kind === 'files' && (
        <FilesAccessWizard
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
      {wizard?.index === index && wizard.kind === 'email' && (
        <EmailWizard
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
      {wizard?.index === index && wizard.kind === 'images' && (
        <ImagesWizard
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
      {wizard?.index === index && wizard.kind === 'logging' && (
        <LoggingWizard
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
      {wizard?.index === index && wizard.kind === 'dynslots' && (
        <DynamicSlotsWizard
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
      {wizard?.index === index && wizard.kind === 'execfiles' && (
        <ExecuteFilesWizard
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
      {wizard?.index === index && TIER2_WIZARDS[wizard.kind] && (
        <GroupWizard
          key={wizard.kind}
          spec={TIER2_WIZARDS[wizard.kind]}
          onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
          onCancel={() => setWizard(null)}
        />
      )}
    </>
  );
}
