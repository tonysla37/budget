import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';
import '../models/transaction.dart';
import '../models/report.dart';

class ApiService {
  static const String _baseUrl = 'http://localhost:8000/api';
  
  final http.Client _client = http.Client();
  String? _token;
  
  static final ApiService _instance = ApiService._internal();
  
  factory ApiService() {
    return _instance;
  }
  
  ApiService._internal();
  
  Future<void> initialize() async {
    await _loadToken();
  }
  
  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }
  
  Future<void> _saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }
  
  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }
  
  bool get isAuthenticated => _token != null;
  
  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    
    return headers;
  }
  
  Future<T> _handleResponse<T>(http.Response response, T Function(Map<String, dynamic>) fromJson) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonResponse = jsonDecode(response.body);
      return fromJson(jsonResponse);
    } else {
      final error = jsonDecode(response.body);
      throw ApiException(
        statusCode: response.statusCode,
        message: error['detail'] ?? 'Une erreur est survenue',
      );
    }
  }
  
  // --- Auth API ---
  
  Future<TokenResponse> login(String email, String password) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/token'),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        'username': email, // OAuth2 uses 'username' regardless of whether it's an email
        'password': password,
      },
    );
    
    final tokenResponse = await _handleResponse<TokenResponse>(
      response,
      (json) => TokenResponse.fromJson(json),
    );
    
    await _saveToken(tokenResponse.accessToken);
    return tokenResponse;
  }
  
  Future<User> register(UserCreate userCreate) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: _headers,
      body: jsonEncode(userCreate.toJson()),
    );
    
    return _handleResponse<User>(
      response,
      (json) => User.fromJson(json),
    );
  }
  
  Future<Map<String, dynamic>> linkBoursoramaAccount(BoursoramaCredentials credentials) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/boursorama'),
      headers: _headers,
      body: jsonEncode(credentials.toJson()),
    );
    
    return _handleResponse<Map<String, dynamic>>(
      response,
      (json) => json,
    );
  }
  
  // --- User API ---
  
  Future<User> getCurrentUser() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/users/me'),
      headers: _headers,
    );
    
    return _handleResponse<User>(
      response,
      (json) => User.fromJson(json),
    );
  }
  
  Future<User> updateUser(UserUpdate userUpdate) async {
    final response = await _client.put(
      Uri.parse('$_baseUrl/users/me'),
      headers: _headers,
      body: jsonEncode(userUpdate.toJson()),
    );
    
    return _handleResponse<User>(
      response,
      (json) => User.fromJson(json),
    );
  }
  
  // --- Transactions API ---
  
  Future<List<Transaction>> getTransactions({
    int? skip,
    int? limit,
    DateTime? startDate,
    DateTime? endDate,
    int? categoryId,
    bool? isExpense,
    int? tagId,
    String? search,
  }) async {
    final queryParams = <String, String>{};
    
    if (skip != null) queryParams['skip'] = skip.toString();
    if (limit != null) queryParams['limit'] = limit.toString();
    if (startDate != null) queryParams['start_date'] = startDate.toIso8601String().split('T').first;
    if (endDate != null) queryParams['end_date'] = endDate.toIso8601String().split('T').first;
    if (categoryId != null) queryParams['category_id'] = categoryId.toString();
    if (isExpense != null) queryParams['is_expense'] = isExpense.toString();
    if (tagId != null) queryParams['tag_id'] = tagId.toString();
    if (search != null) queryParams['search'] = search;
    
    final response = await _client.get(
      Uri.parse('$_baseUrl/transactions').replace(queryParameters: queryParams),
      headers: _headers,
    );
    
    return _handleResponse<List<Transaction>>(
      response,
      (json) => (json as List)
          .map((item) => Transaction.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  Future<Transaction> getTransaction(int id) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/transactions/$id'),
      headers: _headers,
    );
    
    return _handleResponse<Transaction>(
      response,
      (json) => Transaction.fromJson(json),
    );
  }
  
  Future<Transaction> createTransaction(TransactionCreate transaction) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/transactions'),
      headers: _headers,
      body: jsonEncode(transaction.toJson()),
    );
    
    return _handleResponse<Transaction>(
      response,
      (json) => Transaction.fromJson(json),
    );
  }
  
  Future<Transaction> updateTransaction(int id, TransactionUpdate transaction) async {
    final response = await _client.put(
      Uri.parse('$_baseUrl/transactions/$id'),
      headers: _headers,
      body: jsonEncode(transaction.toJson()),
    );
    
    return _handleResponse<Transaction>(
      response,
      (json) => Transaction.fromJson(json),
    );
  }
  
  Future<void> deleteTransaction(int id) async {
    final response = await _client.delete(
      Uri.parse('$_baseUrl/transactions/$id'),
      headers: _headers,
    );
    
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = jsonDecode(response.body);
      throw ApiException(
        statusCode: response.statusCode,
        message: error['detail'] ?? 'Une erreur est survenue',
      );
    }
  }
  
  Future<Map<String, dynamic>> syncTransactions() async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/transactions/sync'),
      headers: _headers,
    );
    
    return _handleResponse<Map<String, dynamic>>(
      response,
      (json) => json,
    );
  }
  
  // --- Categories and Tags API ---
  
  Future<List<Category>> getCategories() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/categories/categories'),
      headers: _headers,
    );
    
    return _handleResponse<List<Category>>(
      response,
      (json) => (json as List)
          .map((item) => Category.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  Future<List<Tag>> getTags() async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/categories/tags'),
      headers: _headers,
    );
    
    return _handleResponse<List<Tag>>(
      response,
      (json) => (json as List)
          .map((item) => Tag.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
  
  // --- Reports API ---
  
  Future<MonthlyReport> getMonthlyReport(int year, int month) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/reports/monthly/$year/$month'),
      headers: _headers,
    );
    
    return _handleResponse<MonthlyReport>(
      response,
      (json) => MonthlyReport.fromJson(json),
    );
  }
  
  Future<PeriodReport> getSalaryBasedReport({DateTime? referenceDate}) async {
    final queryParams = <String, String>{};
    
    if (referenceDate != null) {
      queryParams['reference_date'] = referenceDate.toIso8601String().split('T').first;
    }
    
    final response = await _client.get(
      Uri.parse('$_baseUrl/reports/salary-based').replace(queryParameters: queryParams),
      headers: _headers,
    );
    
    return _handleResponse<PeriodReport>(
      response,
      (json) => PeriodReport.fromJson(json),
    );
  }
  
  Future<TrendResponse> getTrends({
    DateTime? startDate,
    DateTime? endDate,
    String groupBy = 'month',
  }) async {
    final queryParams = <String, String>{};
    
    if (startDate != null) {
      queryParams['start_date'] = startDate.toIso8601String().split('T').first;
    }
    
    if (endDate != null) {
      queryParams['end_date'] = endDate.toIso8601String().split('T').first;
    }
    
    queryParams['group_by'] = groupBy;
    
    final response = await _client.get(
      Uri.parse('$_baseUrl/reports/trends').replace(queryParameters: queryParams),
      headers: _headers,
    );
    
    return _handleResponse<TrendResponse>(
      response,
      (json) => TrendResponse(
        expenses: (json['expenses'] as List)
            .map((item) => TrendData.fromJson(item as Map<String, dynamic>))
            .toList(),
        income: (json['income'] as List)
            .map((item) => TrendData.fromJson(item as Map<String, dynamic>))
            .toList(),
      ),
    );
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException({
    required this.statusCode,
    required this.message,
  });

  @override
  String toString() => 'ApiException: $statusCode - $message';
} 