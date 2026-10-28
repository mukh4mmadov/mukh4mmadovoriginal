// Results are saved to the account only for signed-in, non-guest learners.
export function getAccountUserId(user, profile, isLoading) {
  return !isLoading && user?.id && profile && !profile.is_guest && !user.is_anonymous ? user.id : null;
}
