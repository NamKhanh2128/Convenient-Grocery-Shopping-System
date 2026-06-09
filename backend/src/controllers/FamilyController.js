import { FamilyModel } from '../models/FamilyModel.js';

function ok(res, data, message = 'OK') {
  return res.json({ success: true, data, message });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, data: null, message });
}

function toFamilyDto(family) {
  if (!family) return null;
  return {
    id: family.family_id,
    name: family.family_name,
    code: family.family_code,
    createdAt: family.created_at,
    family_id: family.family_id,
    family_name: family.family_name,
    family_code: family.family_code,
    created_at: family.created_at,
  };
}

function getRequestUserId(req) {
  return req.user?.id || req.user?.user_id;
}

function normalizeFamilyCode(code) {
  return String(code || '').trim().toUpperCase();
}

function makeFamilyCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let index = 0; index < 4; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `FAM-${suffix}`;
}

async function createUniqueFamily(userId, familyName) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await FamilyModel.createFamilyForUser(userId, familyName, makeFamilyCode());
    } catch (error) {
      if (error?.code !== '23505') throw error;
      lastError = error;
    }
  }
  throw lastError || new Error('Khong the sinh ma gia dinh duy nhat.');
}

async function ensureFamilyCode(family) {
  if (!family || family.family_code) return family;

  let lastError;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await FamilyModel.setFamilyCode(family.family_id, makeFamilyCode());
    } catch (error) {
      if (error?.code !== '23505') throw error;
      lastError = error;
    }
  }
  throw lastError || new Error('Khong the sinh ma gia dinh duy nhat.');
}

async function getCurrentFamily(userId) {
  const { user, family } = await FamilyModel.findFamilyForUser(userId);
  if (!user) {
    return { status: 404, message: 'User does not exist' };
  }
  return { user, family };
}

export const FamilyController = {
  async getMe(req, res) {
    try {
      const userId = getRequestUserId(req);
      console.log('[Family] get me user:', userId);
      const current = await getCurrentFamily(userId);
      if (current.status) return fail(res, current.status, current.message);
      console.log('[Family] get me rows:', current.family ? [current.family] : []);
      if (!current.family) return ok(res, null, 'User has not joined any family');

      const family = await ensureFamilyCode(current.family);
      return ok(res, toFamilyDto(family), 'Lay gia dinh hien tai thanh cong.');
    } catch (error) {
      return fail(res, 500, error.message);
    }
  },

  async create(req, res) {
    try {
      console.log('[Family] req.user:', req.user);
      console.log('[Family] create family payload:', req.body);
      const familyName = String(req.body.name || req.body.family_name || '').trim();
      if (!familyName) return fail(res, 400, 'Ten gia dinh la bat buoc.');

      const userId = getRequestUserId(req);
      const user = await FamilyModel.findUserById(userId);
      if (!user) return fail(res, 404, 'User does not exist');

      const family = await createUniqueFamily(userId, familyName);
      return ok(res, toFamilyDto(family), 'Created family successfully');
    } catch (error) {
      console.error('[Family] error:', error);
      return fail(res, 500, error.message);
    }
  },

  async join(req, res) {
    try {
      const code = normalizeFamilyCode(req.body.code || req.body.family_code);
      if (!code) return fail(res, 400, 'Ma gia dinh la bat buoc.');

      const family = await FamilyModel.findFamilyByCode(code);
      if (!family) return fail(res, 404, 'Ma gia dinh khong dung hoac khong ton tai.');

      const userId = getRequestUserId(req);
      const user = await FamilyModel.findUserById(userId);
      if (!user) return fail(res, 404, 'User does not exist');

      await FamilyModel.switchUserToFamily(userId, family.family_id);
      return ok(res, toFamilyDto(family), 'Joined family successfully');
    } catch (error) {
      return fail(res, 500, error.message);
    }
  },

  async updateMe(req, res) {
    try {
      const familyName = String(req.body.name || req.body.family_name || '').trim();
      if (!familyName) return fail(res, 400, 'Ten gia dinh la bat buoc.');

      const current = await getCurrentFamily(getRequestUserId(req));
      if (current.status) return fail(res, current.status, current.message);
      if (!current.family) return fail(res, 400, 'Nguoi dung chua co gia dinh.');

      const family = await FamilyModel.renameFamily(current.family.family_id, familyName);
      return ok(res, toFamilyDto(family), 'Cap nhat ten gia dinh thanh cong.');
    } catch (error) {
      return fail(res, 500, error.message);
    }
  },

  async listMembers(req, res) {
    try {
      const current = await getCurrentFamily(getRequestUserId(req));
      if (current.status) return fail(res, current.status, current.message);
      if (!current.family) return ok(res, [], 'User has not joined any family');

      const members = await FamilyModel.listMembers(current.family.family_id);
      return ok(res, members, 'Lay danh sach thanh vien thanh cong.');
    } catch (error) {
      return fail(res, 500, error.message);
    }
  },

  async addMember(req, res) {
    try {
      const email = String(req.body.email || '').trim();
      const userId = String(req.body.user_id || req.body.id || '').trim();
      if (!email && !userId) return fail(res, 400, 'Can truyen email hoac user_id.');

      const current = await getCurrentFamily(getRequestUserId(req));
      if (current.status) return fail(res, current.status, current.message);
      if (!current.family) return fail(res, 400, 'Nguoi dung chua co gia dinh.');

      const member = email ? await FamilyModel.findUserByEmail(email) : await FamilyModel.findUserById(userId);
      if (!member) return fail(res, 404, 'User with this email does not exist');
      const isMember = await FamilyModel.isMember(member.user_id, current.family.family_id);
      if (isMember) return fail(res, 409, 'User is already a member of this family');

      const invitation = await FamilyModel.createInvitation({
        familyId: current.family.family_id,
        inviterUserId: getRequestUserId(req),
        invitedUserId: member.user_id,
      });

      return ok(res, invitation, 'Invitation sent successfully');
    } catch (error) {
      console.error('[Family] error:', error);
      return fail(res, 500, error.message);
    }
  },

  async listSentInvitations(req, res) {
    try {
      const current = await getCurrentFamily(getRequestUserId(req));
      if (current.status) return fail(res, current.status, current.message);
      if (!current.family) return ok(res, [], 'User has not joined any family');

      const invitations = await FamilyModel.listSentInvitations(current.family.family_id);
      return ok(res, invitations, 'Lay danh sach loi moi da gui thanh cong.');
    } catch (error) {
      console.error('[Family] error:', error);
      return fail(res, 500, error.message);
    }
  },

  async listReceivedInvitations(req, res) {
    try {
      const invitations = await FamilyModel.listReceivedInvitations(getRequestUserId(req));
      return ok(res, invitations, 'Lay danh sach loi moi cua toi thanh cong.');
    } catch (error) {
      console.error('[Family] error:', error);
      return fail(res, 500, error.message);
    }
  },

  async acceptInvitation(req, res) {
    try {
      const invitationId = String(req.params.id || '').trim();
      if (!invitationId) return fail(res, 400, 'Thieu ma loi moi.');

      const result = await FamilyModel.acceptInvitation(invitationId, getRequestUserId(req));
      if (result.status === 'not_found') return fail(res, 404, 'Invitation does not exist');
      if (result.status === 'not_pending') return fail(res, 409, 'Invitation is not pending');

      return ok(res, toFamilyDto(result.family), 'Invitation accepted successfully');
    } catch (error) {
      console.error('[Family] error:', error);
      return fail(res, 500, error.message);
    }
  },

  async rejectInvitation(req, res) {
    try {
      const invitationId = String(req.params.id || '').trim();
      if (!invitationId) return fail(res, 400, 'Thieu ma loi moi.');

      const invitation = await FamilyModel.rejectInvitation(invitationId, getRequestUserId(req));
      if (!invitation) return fail(res, 404, 'Invitation does not exist');

      return ok(res, invitation, 'Invitation rejected successfully');
    } catch (error) {
      console.error('[Family] error:', error);
      return fail(res, 500, error.message);
    }
  },

  async removeMember(req, res) {
    try {
      const memberId = String(req.params.id || '').trim();
      if (!memberId) return fail(res, 400, 'Thieu ma thanh vien.');

      const currentUserId = String(getRequestUserId(req));
      console.log('[Family] remove member currentUser:', currentUserId);
      console.log('[Family] remove targetUserId:', memberId);
      const current = await getCurrentFamily(currentUserId);
      if (current.status) return fail(res, current.status, current.message);
      if (!current.family) return fail(res, 400, 'Nguoi dung chua co gia dinh.');

      const currentMember = await FamilyModel.findMember(currentUserId, current.family.family_id);
      if (currentMember?.role !== 'admin') {
        return fail(res, 403, 'Only family admin can perform this action');
      }

      if (memberId === currentUserId && (await FamilyModel.countMembers(current.family.family_id)) > 1) {
        return fail(res, 403, 'Transfer admin role before leaving this family');
      }

      const result = await FamilyModel.detachMemberFromFamily(memberId, current.family.family_id);
      console.log('[Family] delete rowCount:', result.rowCount);
      if (result.rowCount === 0) return fail(res, 404, 'Member not found in this family');

      const member = result.member;
      return ok(res, { member }, 'Da tach thanh vien khoi gia dinh.');
    } catch (error) {
      return fail(res, 500, error.message);
    }
  },

  async transferAdmin(req, res) {
    try {
      const targetUserId = String(req.body.targetUserId || req.body.target_user_id || '').trim();
      if (!targetUserId) return fail(res, 400, 'Thieu thanh vien nhan quyen quan tri.');

      const currentUserId = String(getRequestUserId(req));
      if (targetUserId === currentUserId) {
        return fail(res, 400, 'Cannot transfer admin role to yourself');
      }

      const current = await getCurrentFamily(currentUserId);
      if (current.status) return fail(res, current.status, current.message);
      if (!current.family) return fail(res, 400, 'Nguoi dung chua co gia dinh.');

      const currentMember = await FamilyModel.findMember(currentUserId, current.family.family_id);
      if (currentMember?.role !== 'admin') {
        return fail(res, 403, 'Only family admin can perform this action');
      }

      const targetMember = await FamilyModel.findMember(targetUserId, current.family.family_id);
      if (!targetMember) return fail(res, 404, 'Target user is not a member of this family');

      await FamilyModel.transferAdminRole(current.family.family_id, currentUserId, targetUserId);
      return ok(res, null, 'Admin role transferred successfully');
    } catch (error) {
      console.error('[Family] error:', error);
      return fail(res, 500, error.message);
    }
  },

  async leave(req, res) {
    try {
      console.log('[Family] leave user:', req.user);
      const current = await getCurrentFamily(getRequestUserId(req));
      if (current.status) return fail(res, current.status, current.message);
      if (!current.family) return fail(res, 400, 'User has not joined any family');
      console.log('[Family] leave family:', current.family);

      const currentMember = await FamilyModel.findMember(getRequestUserId(req), current.family.family_id);
      if (currentMember?.role === 'admin' && (await FamilyModel.countMembers(current.family.family_id)) > 1) {
        return fail(res, 403, 'Transfer admin role before leaving this family');
      }

      await FamilyModel.leaveFamily(getRequestUserId(req), current.family.family_id);

      return ok(res, null, 'Left family successfully');
    } catch (error) {
      console.error('[Family] leave error:', error);
      return fail(res, 500, error.message);
    }
  },
};
