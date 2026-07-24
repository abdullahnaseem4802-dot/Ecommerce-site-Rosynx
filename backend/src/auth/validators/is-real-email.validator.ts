import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { promises as dns } from 'dns';

/**
 * Rejects addresses whose domain cannot receive mail — i.e. "real email, not a
 * dummy". Runs a DNS MX lookup (falling back to an A record, which some domains
 * use to accept mail). This is the strongest check we can do WITHOUT sending a
 * verification email: it blocks typo'd and made-up domains (asdf@asdf.qwe,
 * test@nope.invalid) while accepting any domain that actually runs a mailserver.
 *
 * Failure policy: a *definitive* "no such domain / no mail records" answer
 * rejects; a transient DNS error (timeout, server failure) is allowed through
 * so a DNS blip can never lock a real customer out of signing up.
 */
@ValidatorConstraint({ name: 'isRealEmail', async: true })
export class IsRealEmailConstraint implements ValidatorConstraintInterface {
  async validate(email: unknown): Promise<boolean> {
    if (typeof email !== 'string') return false;
    const at = email.lastIndexOf('@');
    if (at < 1) return false;
    const domain = email.slice(at + 1).toLowerCase().trim();
    // Must be a plausible FQDN with a dot and a TLD of 2+ chars.
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return false;

    try {
      const mx = await dns.resolveMx(domain);
      if (mx.some((r) => r.exchange)) return true;
    } catch (err) {
      if (!isDefinitiveDnsMiss(err)) return true; // transient — fail open
    }
    // No MX: some domains still accept mail via their A/AAAA record.
    try {
      const a = await dns.resolve(domain);
      return a.length > 0;
    } catch (err) {
      if (!isDefinitiveDnsMiss(err)) return true; // transient — fail open
      return false; // domain truly doesn't exist / has no records
    }
  }

  defaultMessage(): string {
    return 'Please enter a real email address — this domain does not accept mail';
  }
}

function isDefinitiveDnsMiss(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === 'ENOTFOUND' || code === 'ENODATA' || code === 'NXDOMAIN';
}

export function IsRealEmail(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRealEmail',
      target: object.constructor,
      propertyName,
      options,
      validator: IsRealEmailConstraint,
    });
  };
}
