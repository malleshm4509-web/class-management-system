package com.mallesh.jkb.user;

import lombok.Data;

@Data
public class UserCreateRequest {
    private String email;
    private String password;
    private String name;
}
