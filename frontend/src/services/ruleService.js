import { apiCall } from '../config/api.config';

export const getRules = async () => {
  const response = await apiCall('/api/rules');
  return response;
};

export const createRule = async (ruleData) => {
  const response = await apiCall('/api/rules', {
    method: 'POST',
    body: JSON.stringify(ruleData)
  });
  return response;
};

export const updateRule = async (id, ruleData) => {
  const response = await apiCall(`/api/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ruleData)
  });
  return response;
};

export const deleteRule = async (id) => {
  const response = await apiCall(`/api/rules/${id}`, {
    method: 'DELETE'
  });
  return response;
};

export const applyRuleToTransaction = async (transactionId) => {
  const response = await apiCall(`/api/rules/apply/${transactionId}`, {
    method: 'POST'
  });
  return response;
};

export const applyRuleToAllTransactions = async (ruleId) => {
  const response = await apiCall(`/api/rules/apply-all/${ruleId}`, {
    method: 'POST'
  });
  return response;
};
