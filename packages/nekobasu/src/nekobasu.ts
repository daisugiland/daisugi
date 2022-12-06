export type NekobasuEventHandler = (
  event: NekobasuEvent,
) => Promise<unknown>;
export interface NekobasuSub {
  subId: number;
  topicRe: RegExp;
  topicWildcard: string;
  eventHandler: NekobasuEventHandler;
}
export interface NekobasuEvent {
  topicName: string;
  payload: unknown;
  mut: Record<string, unknown>;
}

/**
 * Multicast
 *
 * Glossary:
 * subscription -> sub
 */
export class Nekobasu {
  #subCount = 0;
  #subs: NekobasuSub[] = [];

  subscribe(
    topicWildcard: string,
    eventHandler: NekobasuEventHandler,
  ) {
    this.#subCount += 1;
    this.#subs.push({
      subId: this.#subCount,
      topicRe: Nekobasu.#topicWildcardToRe(topicWildcard),
      topicWildcard,
      eventHandler,
    });
    return this.#subCount;
  }

  async dispatch(topicName: string, eventArgs: unknown) {
    const subs = this.#subs.filter((sub) =>
      sub.topicRe.test(topicName),
    );
    const event = {
      topicName,
      payload: eventArgs,
      mut: {},
    };
    if (subs) {
      await Promise.all(
        subs.map((sub) => sub.eventHandler(event)),
      );
    }
    return event;
  }

  unsubscribe(subId: number) {
    this.#subs = this.#subs.filter(
      (sub) => sub.subId !== subId,
    );
  }

  list() {
    return this.#subs;
  }

  /**
   * Creates a RegExp from the given string, converting asterisks to .* expressions, and escaping all other characters.
   */
  static #topicWildcardToRe(topicWildcard: string) {
    return new RegExp(
      `^${topicWildcard
        .split('*')
        .map(Nekobasu.#reEscape)
        .join('.*')}$`,
    );
  }

  /**
   * RegExp-escapes all characters in the given string.
   */
  static #reEscape(topicWildcardPart: string) {
    return topicWildcardPart.replace(
      /[|\\{}()[\]^$+*?.]/g,
      '\\$&',
    );
  }
}
