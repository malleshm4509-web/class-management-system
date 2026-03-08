package com.mallesh.jkb.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Add this method
    Optional<User> findByEmail(String email);
}
