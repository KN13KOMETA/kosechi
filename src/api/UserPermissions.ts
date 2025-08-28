const mask = (pos: number) => 1 << pos;

export default class UserPermissions {
  perms: number;

  constructor(permissions: number = 0) {
    this.perms = permissions;
  }

  #getField(pos: number): boolean {
    return (this.perms & mask(pos)) != 0;
  }

  #setField(pos: number, v: boolean): void {
    if (v) {
      this.perms |= mask(pos);
    } else {
      this.perms &= ~mask(pos);
    }
  }

  get channelReadMessages(): boolean {
    return this.#getField(0);
  }
  get channelReadMessagesHistory(): boolean {
    return this.#getField(1);
  }
  get channelWriteMessages(): boolean {
    return this.#getField(2);
  }
  get channelManageMessages(): boolean {
    return this.#getField(3);
  }
  get manageChannels(): boolean {
    return this.#getField(4);
  }
  get manageRoles(): boolean {
    return this.#getField(5);
  }
  get inviteUsers(): boolean {
    return this.#getField(6);
  }
  get manageUsers(): boolean {
    return this.#getField(7);
  }
  get admin(): boolean {
    return this.#getField(8);
  }
  get superadmin(): boolean {
    return this.#getField(9);
  }

  set channelReadMessages(v: boolean) {
    this.#setField(0, v);
  }
  set channelReadMessagesHistory(v: boolean) {
    this.#setField(1, v);
  }
  set channelWriteMessages(v: boolean) {
    this.#setField(2, v);
  }
  set channelManageMessages(v: boolean) {
    this.#setField(3, v);
  }
  set manageChannels(v: boolean) {
    this.#setField(4, v);
  }
  set manageRoles(v: boolean) {
    this.#setField(5, v);
  }
  set inviteUsers(v: boolean) {
    this.#setField(6, v);
  }
  set manageUsers(v: boolean) {
    this.#setField(7, v);
  }
  set admin(v: boolean) {
    this.#setField(8, v);
  }
  set superadmin(v: boolean) {
    this.#setField(9, v);
  }
}
