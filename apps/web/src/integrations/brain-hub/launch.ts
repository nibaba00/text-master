import {
  getBrainHubLaunchContext,
  hasValidBrainHubLaunchContext,
  type BrainHubLaunchContext,
  type BrainHubPermission,
} from './launchContext';

export type BrainHubLaunchResult = {
  context: BrainHubLaunchContext;
  acceptedPermissions: BrainHubPermission[];
};

export async function launchTextMasterFromBrainHub(
  requiredPermissions: BrainHubPermission[] = [],
): Promise<BrainHubLaunchResult | null> {
  const context = await getBrainHubLaunchContext();

  if (!hasValidBrainHubLaunchContext(context)) {
    return null;
  }

  const acceptedPermissions = requiredPermissions.filter((permission) =>
    context.permissions.includes(permission),
  );

  if (acceptedPermissions.length !== requiredPermissions.length) {
    return null;
  }

  return {
    context,
    acceptedPermissions,
  };
}

export async function resolveOptionalBrainHubLaunchContext(): Promise<BrainHubLaunchContext | null> {
  try {
    return (await launchTextMasterFromBrainHub())?.context ?? null;
  } catch {
    return null;
  }
}
