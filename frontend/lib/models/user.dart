import 'dart:convert';
import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final int id;
  final String email;
  final String? firstName;
  final String? lastName;
  final bool isActive;
  final bool isSuperuser;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? lastSync;

  User({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    required this.isActive,
    required this.isSuperuser,
    required this.createdAt,
    this.updatedAt,
    this.lastSync,
  });

  String get fullName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    } else if (firstName != null) {
      return firstName!;
    } else if (lastName != null) {
      return lastName!;
    } else {
      return email.split('@').first;
    }
  }

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class UserCreate {
  final String email;
  final String password;
  final String? firstName;
  final String? lastName;
  final bool isActive;

  UserCreate({
    required this.email,
    required this.password,
    this.firstName,
    this.lastName,
    this.isActive = true,
  });

  factory UserCreate.fromJson(Map<String, dynamic> json) => _$UserCreateFromJson(json);
  
  Map<String, dynamic> toJson() => _$UserCreateToJson(this);
}

@JsonSerializable()
class UserUpdate {
  final String? email;
  final String? password;
  final String? firstName;
  final String? lastName;

  UserUpdate({
    this.email,
    this.password,
    this.firstName,
    this.lastName,
  });

  factory UserUpdate.fromJson(Map<String, dynamic> json) => _$UserUpdateFromJson(json);
  
  Map<String, dynamic> toJson() => _$UserUpdateToJson(this);
}

@JsonSerializable()
class TokenResponse {
  final String accessToken;
  final String tokenType;

  TokenResponse({
    required this.accessToken,
    required this.tokenType,
  });

  factory TokenResponse.fromJson(Map<String, dynamic> json) => _$TokenResponseFromJson(json);
  
  Map<String, dynamic> toJson() => _$TokenResponseToJson(this);
}

@JsonSerializable()
class BoursoramaCredentials {
  final String username;
  final String password;

  BoursoramaCredentials({
    required this.username,
    required this.password,
  });

  factory BoursoramaCredentials.fromJson(Map<String, dynamic> json) => _$BoursoramaCredentialsFromJson(json);
  
  Map<String, dynamic> toJson() => _$BoursoramaCredentialsToJson(this);
} 