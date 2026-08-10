/*
 * OIDC identities became provider-scoped ("google:john@doe.com"), to stop email
 * collisions from linking a provider sign-in into an unrelated (possibly root)
 * account. Google was the only OIDC provider before this version, so every
 * legacy OIDC user - recognized by the literal 'openid-connect' password - is
 * renamed under the google prefix, roles and extra fields included.
 *
 * Runs on every startup, so it is idempotent: once no bare-email OIDC users
 * remain, nothing matches. New user rows are inserted first and old ones
 * deleted last, since the foreign keys cascade deletes but not updates - and
 * 'or ignore' handles users who signed in with the new version before this
 * script ran, and hence already have a scoped twin: their leftover legacy rows
 * are swept away by the cascading delete at the end.
 */
insert or ignore into users (username, password, created) select 'google:' || username, password, created from users where password = 'openid-connect' and username not like '%:%';

update or ignore users_roles set user = 'google:' || user where user in (select username from users where password = 'openid-connect' and username not like '%:%');

update or ignore users_extra set user = 'google:' || user where user in (select username from users where password = 'openid-connect' and username not like '%:%');

delete from users where password = 'openid-connect' and username not like '%:%';
